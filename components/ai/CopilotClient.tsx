'use client';

import { ChatInterface } from '@/components/ai/ChatInterface';
import { Brain, Zap, MessageSquare } from 'lucide-react';

const EXAMPLE_QUERIES = [
  'Which ward has the most unresolved road complaints?',
  'Which department has the worst resolution time?',
  'Show me all critical issues older than 48 hours',
  'What should we prioritize tomorrow?',
  'Which zone has the most drainage problems?',
  'How many SLA breaches do we have?',
  'Ward 13 mein kitne active issues hain?',
  'Garbage complaints किती आहेत Gandhibagh मध्ये?',
];

export function CopilotClient() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={24} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>AI City Copilot</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Query Nagpur civic data in natural language — for municipal officials and administrators
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div className="demo-banner"><span>⚠ Demo Data</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '4px 10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-full)' }}>
            <Zap size={11} style={{ color: 'var(--accent-purple)' }} />
            Powered by Gemini 2.0 Flash + NagariX Tools
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Chat */}
        <div>
          <ChatInterface
            placeholder="Ask about Nagpur civic data... (English, Hindi, Marathi)"
            initialMessage={`Welcome to the **NagariX AI City Copilot** — your municipal intelligence assistant.

I can query live civic data to answer questions like:
• "Which ward has the most critical issues?"
• "What are the top unresolved drainage complaints?"
• "Give me a city-wide status overview"
• "Priority recommendations for tomorrow"

All responses are based on **demo data**. I use NagariX tools to query the database — I never fabricate statistics.

What would you like to know?`}
          />
        </div>

        {/* Suggestions Panel */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
              <MessageSquare size={16} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Example Questions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {EXAMPLE_QUERIES.map(q => (
                <div
                  key={q}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    lineHeight: 1.5,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-blue)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  {q}
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-4" style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-purple)', marginBottom: 'var(--space-3)' }}>
              🔮 Available AI Tools
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {['get_city_status', 'get_ward_statistics', 'search_issues', 'get_issue_details', 'get_priority_recommendations', 'get_analytics'].map(tool => (
                <div key={tool} style={{ fontFamily: 'var(--font-mono)', padding: '3px 8px', background: 'rgba(139,92,246,0.1)', borderRadius: 4, display: 'inline-block', color: 'var(--accent-purple)' }}>
                  {tool}()
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
