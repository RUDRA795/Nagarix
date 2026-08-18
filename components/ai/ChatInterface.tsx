'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Zap, Sparkles, Database } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'gemini' | 'offline-sqlite';
}

interface ChatInterfaceProps {
  placeholder?: string;
  compact?: boolean;
  initialMessage?: string;
  suggestedPrompts?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "What's happening in Ward 12?",
  "Show critical civic issues.",
  "How many complaints were resolved today?",
  "Report a civic issue.",
];

export function ChatInterface({
  placeholder,
  compact = false,
  initialMessage,
  suggestedPrompts = DEFAULT_SUGGESTIONS,
}: ChatInterfaceProps) {
  const [sessionId] = useState(() => generateSessionId());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        initialMessage ||
        `Namaste! 🏙️ I'm the **NagariX AI Urban Intelligence Assistant** for Nagpur.\n\nI can help you:\n• **Report** a civic issue (potholes, garbage, drainage, water supply)\n• **Track** complaints by ticket ID (e.g. \`NX-2026-000001\`)\n• **Query** real-time ward statistics & city analytics\n• Answer general urban planning questions\n\nआप हिंदी में भी बात कर सकते हैं। तुम्ही मराठीत देखील बोलू शकता. How can I help you today?`,
      source: 'gemini',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(textToSend?: string) {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    setInput('');
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: sessionId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const aiSource = res.headers.get('X-AI-Source');
      if (aiSource === 'offline-sqlite') {
        setMode('offline');
      } else {
        setMode('online');
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response stream');
      }

      setMessages(prev => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', source: aiSource === 'offline-sqlite' ? 'offline-sqlite' : 'gemini' },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (err: unknown) {
      console.error('[Chat error]', err);
      setError('Unable to complete response. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container" style={{ height: compact ? '440px' : '620px' }}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-avatar assistant" style={{ width: 32, height: 32, fontSize: 14 }}>
          <Bot size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>NagariX AI Assistant</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: mode === 'online' ? 'var(--color-success)' : 'var(--color-warning)',
              display: 'inline-block',
            }} />
            {mode === 'online' ? (
              <span>● Gemini AI — Online (Live Tools)</span>
            ) : (
              <span>⚡ Offline Mode (Local SQLite)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {mode === 'online' ? (
            <>
              <Zap size={12} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Gemini Online</span>
            </>
          ) : (
            <>
              <Database size={12} style={{ color: 'var(--color-warning)' }} />
              <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Offline Mode</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className={`chat-avatar ${message.role}`}>
              {message.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`chat-bubble ${message.role}`}>
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-avatar assistant">
              <Bot size={14} />
            </div>
            <div className="chat-bubble assistant">
              <div className="chat-typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-message assistant">
            <div className="chat-avatar assistant"><Bot size={14} /></div>
            <div className="chat-bubble assistant" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-danger)' }}>
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && !isLoading && suggestedPrompts.length > 0 && (
        <div style={{
          padding: '0 var(--space-4) var(--space-2)',
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {suggestedPrompts.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Sparkles size={10} style={{ color: 'var(--accent-blue)' }} />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-input-row"
        >
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Ask about Nagpur civic issues... (English, Hindi, Marathi, Hinglish)'}
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          Press Enter to send · Shift+Enter for newline · Supports English, हिंदी & मराठी
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return null;

  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(59,130,246,0.12);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.85em;color:var(--accent-blue)">$1</code>')
    // Parse Markdown Links [Text](/map?...) into interactive action buttons
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,rgba(249,115,22,0.15),rgba(234,88,12,0.1));border:1px solid rgba(249,115,22,0.3);border-radius:16px;padding:3px 10px;font-size:0.82em;font-weight:700;color:var(--accent-orange);text-decoration:none;margin:3px 2px;transition:all 0.15s ease" onmouseover="this.style.background=\'rgba(249,115,22,0.25)\'" onmouseout="this.style.background=\'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(234,88,12,0.1))\'">$1 ↗</a>')
    .split('\n')
    .map((line, idx) => {
      if (line.startsWith('• ') || line.startsWith('* ')) {
        return `<div key="${idx}" style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--accent-orange);margin-top:1px">•</span><span>${line.substring(2)}</span></div>`;
      }
      return `<div key="${idx}" style="min-height:4px">${line}</div>`;
    })
    .join('');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
}
