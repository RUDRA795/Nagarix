import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, isStepCount } from 'ai';
import { civicTools } from '@/lib/ai/tools';
import { NAGARIX_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { prisma } from '@/lib/prisma';
import { processOfflineFallback } from '@/lib/ai/fallback';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  let conversationId: string | undefined;
  let latestUserMessageText = '';

  try {
    const body = await req.json();
    const { messages } = body;
    conversationId = body.conversationId;

    const latestMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    latestUserMessageText = typeof latestMsg?.content === 'string' ? latestMsg.content : '';

    // Persist user message to DB if session exists
    if (conversationId && latestUserMessageText) {
      try {
        const conv = await prisma.conversation.upsert({
          where: { sessionId: conversationId },
          update: { updatedAt: new Date() },
          create: { sessionId: conversationId },
        });

        await prisma.message.create({
          data: {
            conversationId: conv.id,
            role: 'user',
            content: latestUserMessageText,
          },
        });
      } catch {
        // Non-blocking DB logging
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    // If Gemini key is available, attempt full online generation with tools
    if (apiKey) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        const recentMessages = messages.slice(-8);

        const result = streamText({
          model: google(modelName),
          messages: recentMessages,
          system: NAGARIX_SYSTEM_PROMPT,
          tools: civicTools,
          stopWhen: isStepCount(5),
          onFinish: async ({ text }) => {
            if (conversationId && text) {
              try {
                const conv = await prisma.conversation.findUnique({
                  where: { sessionId: conversationId },
                  select: { id: true },
                });
                if (conv) {
                  await prisma.message.create({
                    data: {
                      conversationId: conv.id,
                      role: 'assistant',
                      content: text,
                    },
                  });
                }
              } catch {
                // Non-blocking
              }
            }
          },
        });

        const streamResponse = result.toTextStreamResponse();
        const headers = new Headers(streamResponse.headers);
        headers.set('X-AI-Source', 'gemini');
        headers.set('X-AI-Model', modelName);

        return new Response(streamResponse.body, {
          status: streamResponse.status,
          statusText: streamResponse.statusText,
          headers,
        });
      } catch (geminiError) {
        console.warn('[Gemini Online Stream Error — Falling back to local SQLite engine]:', geminiError);
      }
    }

    // Offline / Local SQLite Fallback Engine
    const fallbackResult = await processOfflineFallback(latestUserMessageText || 'overview');

    // Save fallback response to DB if session exists
    if (conversationId) {
      try {
        const conv = await prisma.conversation.findUnique({
          where: { sessionId: conversationId },
          select: { id: true },
        });
        if (conv) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              role: 'assistant',
              content: fallbackResult.text,
              metadata: JSON.stringify({ source: 'offline-sqlite', intent: fallbackResult.intent }),
            },
          });
        }
      } catch {
        // Non-blocking
      }
    }

    // Stream the fallback response chunk by chunk for consistent UI experience
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackResult.text.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          controller.enqueue(encoder.encode(chunk));
          await new Promise(r => setTimeout(r, 16));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-AI-Source': 'offline-sqlite',
        'X-AI-Fallback-Intent': fallbackResult.intent,
      },
    });
  } catch (error) {
    console.error('[Chat API Fatal Error]', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
