'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { Brain, Zap, MessageSquare, FileText, Download, Copy, Check, Sparkles, MapPin, ShieldAlert, Layers } from 'lucide-react';
import Link from 'next/link';

const EXAMPLE_QUERIES = [
  'Generate an executive city report for Nagpur Municipal Corporation',
  'Which ward has the lowest civic health score?',
  'Detect recurring drainage problems across Nagpur',
  'Show all cross-department utility conflicts',
  'What should the Road Maintenance Department prioritize tomorrow?',
  'How many complaints have breached SLA deadlines?',
  'Ward 14 Mahal mein kachra aur water supply ka kya scene hai?',
  'Dharampeth मध्ये रस्ता आणि ड्रेनेज तक्रारी किती प्रलंबित आहेत?',
];

export function CopilotClient() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportMarkdown(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Generate an official, structured Executive Municipal Report for Nagpur Municipal Corporation (NMC). Include City Status, Civic Health Index, Sector Breakdown, SLA Breaches, Top Incident Clusters, Recurring Problems, and Recommended Municipal Directives with map action links.',
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const text = await res.text();
      setReportMarkdown(text);
    } catch (e) {
      console.error(e);
      setReportMarkdown('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (reportMarkdown) {
      navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.2))', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={24} style={{ color: 'var(--accent-orange)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>AI City Copilot & Executive Intelligence</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Decision-support AI grounded in real SQLite data, Turf.js spatial clustering, and NMC municipal workflows.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerateReport}
              disabled={generatingReport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
            >
              <FileText size={14} />
              {generatingReport ? 'Synthesizing Report...' : 'Generate Executive Report'}
            </button>
            <Link href="/map" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> View Map GIS
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '4px 10px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 'var(--radius-full)' }}>
            <Zap size={11} style={{ color: 'var(--accent-orange)' }} />
            Powered by Gemini 3.6 Flash · Grounded Spatial Tools · Multilingual (English, Hindi, Marathi, Hinglish)
          </div>
        </div>
      </div>

      {/* Generated Report Drawer / Modal if active */}
      {reportMarkdown && (
        <div className="card-elevated" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-6)', borderLeft: '4px solid var(--accent-orange)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--accent-orange)' }} />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official NMC Executive City Intelligence Report
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyReport} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '11px' }}>
                {copied ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Report'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setReportMarkdown(null)} style={{ fontSize: '11px' }}>
                Close
              </button>
            </div>
          </div>
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            maxHeight: 380,
            overflowY: 'auto',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono)'
          }}>
            {reportMarkdown}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Chat Interface */}
        <div>
          <ChatInterface
            key={selectedPrompt || 'copilot-default'}
            suggestedPrompts={EXAMPLE_QUERIES}
            placeholder="Ask the AI Copilot about Nagpur civic records, wards, SLA risks... (English, Hindi, Marathi)"
            initialMessage={`Welcome to the **NagariX AI City Copilot** — Nagpur Municipal Corporation's grounded decision-support engine.

I have direct tool access to:
• **Civic Health Index** across Nagpur & individual wards
• **SLA Risk Engine** (Safe, Watch, At Risk, Breached)
• **Turf.js Incident Clusters** & Multi-Issue Hotspots
• **Recurring Problem Detector** over 60-day spans
• **Cross-Department Conflict Alerts** (Roads × Water × Drainage)

Ask any municipal query or click an example on the right.`}
          />
        </div>

        {/* Intelligence Actions & Query Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Quick Tools Box */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-orange)', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} /> Grounded Copilot Tools
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPrompt('Show me the top recurring problems across Nagpur')}
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '11px' }}
              >
                🔄 Detect Recurring Issues
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPrompt('Which wards have critical SLA breaches right now?')}
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '11px' }}
              >
                🚨 SLA Breach Analysis
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPrompt('Show cross-department conflicts between Water Works and Road Maintenance')}
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '11px' }}
              >
                ⚡ Cross-Dept Utility Overlaps
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPrompt('Give me the complete Nagpur Civic Health Index breakdown')}
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '11px' }}
              >
                🩺 Civic Health Score
              </button>
            </div>
          </div>

          {/* Example Questions */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <MessageSquare size={14} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Sample Inquiries</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {EXAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedPrompt(q)}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-orange)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
