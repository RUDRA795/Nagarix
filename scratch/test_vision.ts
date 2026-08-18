import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testVision() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const google = createGoogleGenerativeAI({ apiKey });
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    const result = await generateText({
      model: google('gemini-3.6-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are NagariX Civic Vision AI for Nagpur Municipal Corporation.
Analyze this photo to determine if it shows a municipal/civic issue (e.g. Potholes, Garbage overflow, Drainage, Waterlogging, Broken Streetlights).
Output strict JSON with:
{
  "isCivicIssue": boolean,
  "category": "Road/Pothole" | "Garbage" | "Drainage" | "Water Supply" | "Waterlogging" | "Streetlight" | "Traffic Signal" | "Tree/Green" | "Public Toilet" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "title": string,
  "description": string,
  "department": string,
  "confidence": number,
  "evidence": string[]
}`,
            },
            {
              type: 'file',
              data: sampleBase64,
              mediaType: 'image/png',
            },
          ],
        },
      ],
    });

    console.log('>>> Gemini Vision Response:\n', result.text);
  } catch (err) {
    console.error('Vision test error:', err);
  }
}

testVision();
