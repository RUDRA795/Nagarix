'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, MapPin, Phone, Tag, FileText,
  Camera, Upload, Sparkles, X, Eye, ShieldCheck, RefreshCw,
  Navigation, Building, Layers
} from 'lucide-react';
import { CATEGORY_LIST, SEVERITY_LIST, NAGPUR_ZONES, getCategoryIcon } from '@/lib/utils';
import type { VisionAnalysisResult } from '@/app/api/ai/analyze-image/route';

interface FormData {
  category: string;
  title: string;
  description: string;
  severity: string;
  zone: string;
  wardNumber: string;
  locality: string;
  contactPhone: string;
  latitude?: number;
  longitude?: number;
}

interface SubmitResult {
  ticketId: string;
  department: string;
  category: string;
  severity: string;
  locality?: string;
  wardNumber?: number;
}

const INITIAL_FORM: FormData = {
  category: '',
  title: '',
  description: '',
  severity: 'Medium',
  zone: '',
  wardNumber: '',
  locality: '',
  contactPhone: '',
};

export function ReportForm() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [userNotes, setUserNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be under 10MB.');
      return;
    }

    setImageMimeType(file.type);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      // Auto-trigger Gemini analysis
      triggerGeminiAnalysis(base64, file.type, userNotes);
    };
    reader.readAsDataURL(file);
  }

  // Load sample image for testing
  function loadSampleImage(sampleType: 'pothole' | 'garbage' | 'drainage') {
    // Generate simple SVG data URL representations of issues for demo
    const svgMap = {
      pothole: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#333"/><rect y="120" width="400" height="60" fill="#222"/><ellipse cx="200" cy="150" rx="80" ry="30" fill="#111" stroke="#555" stroke-width="4"/><text x="200" y="240" font-family="sans-serif" font-size="16" fill="#fff" text-anchor="middle">Large asphalt pothole on main road</text></svg>`,
      garbage: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#445"/><rect y="160" width="400" height="140" fill="#334"/><path d="M120 200 L180 120 L240 210 L200 230 Z" fill="#8b5a2b"/><path d="M160 210 L220 140 L280 220 Z" fill="#2e8b57"/><text x="200" y="270" font-family="sans-serif" font-size="16" fill="#fff" text-anchor="middle">Overflowing uncollected garbage heap</text></svg>`,
      drainage: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#2c3e50"/><rect y="140" width="400" height="160" fill="#1a252f"/><path d="M50 180 Q200 220 350 180" stroke="#3498db" stroke-width="25" fill="none"/><circle cx="200" cy="180" r="30" fill="#e74c3c"/><text x="200" y="260" font-family="sans-serif" font-size="16" fill="#fff" text-anchor="middle">Broken drainage pipe overflowing</text></svg>`,
    };

    const svg = svgMap[sampleType];
    const base64 = `data:image/svg+xml;base64,${btoa(svg)}`;
    setImagePreview(base64);
    setImageMimeType('image/svg+xml');
    triggerGeminiAnalysis(base64, 'image/svg+xml', userNotes || `Sample photo of ${sampleType} in Nagpur`);
  }

  // Trigger Gemini Multimodal Analysis
  async function triggerGeminiAnalysis(base64: string, mime: string, notes?: string) {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setAiError(null);

    const stepTimer = setInterval(() => {
      setAnalysisStep(s => (s < 3 ? s + 1 : s));
    }, 800);

    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mime,
          userNotes: notes,
        }),
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        throw new Error('Vision analysis service returned an error');
      }

      const data = await res.json();
      if (data.available && data.analysis) {
        const analysis: VisionAnalysisResult = data.analysis;
        setAiAnalysis(analysis);

        // Autofill form with AI recommendations (user can still edit)
        setForm(f => ({
          ...f,
          category: analysis.category || f.category,
          title: analysis.title || f.title,
          description: analysis.description || f.description,
          severity: analysis.severity || f.severity,
        }));
      } else {
        setAiError(data.error || 'Gemini Vision analysis is currently unavailable. You can enter details manually.');
      }
    } catch (err: any) {
      clearInterval(stepTimer);
      console.warn('[Vision analysis error]', err);
      setAiError('Gemini Vision analysis is temporarily unavailable. Please fill in the details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Geolocation lookup
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setForm(f => ({
          ...f,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          locality: f.locality || 'Current GPS Location (Nagpur)',
        }));
      },
      () => {
        setLocating(false);
        // Default to central Nagpur coords if permission denied
        setForm(f => ({
          ...f,
          latitude: 21.1458,
          longitude: 79.0882,
          locality: f.locality || 'Nagpur Central (Coordinates Auto-Set)',
        }));
      }
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.description) {
      setError('Category and description are required.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          title: form.title || form.description.substring(0, 80),
          description: form.description,
          severity: form.severity,
          zone: form.zone || undefined,
          wardNumber: form.wardNumber || undefined,
          locality: form.locality || undefined,
          latitude: form.latitude,
          longitude: form.longitude,
          contactPhone: form.contactPhone || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit complaint');
        return;
      }

      const data = await res.json();
      setResult({
        ticketId: data.ticketId,
        department: data.issue?.department || 'NMC Department',
        category: form.category,
        severity: form.severity,
        locality: form.locality,
        wardNumber: form.wardNumber ? parseInt(form.wardNumber) : undefined,
      });
      setForm(INITIAL_FORM);
      setImagePreview(null);
      setAiAnalysis(null);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS CONFIRMATION SCREEN ──────────────────────────
  if (result) {
    return (
      <div className="card-elevated" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)', border: '2px solid var(--color-success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-4)', fontSize: 32
        }}>
          ✅
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
          Civic Issue Successfully Registered
        </div>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
          Complaint Dispatched
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto var(--space-6)', lineHeight: 1.6 }}>
          Your civic issue has been logged into the Nagpur Municipal Corporation network and assigned to <strong>{result.department}</strong>.
        </p>

        {/* Ticket ID Box */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5) var(--space-10)',
          marginBottom: 'var(--space-8)',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
            OFFICIAL NMC TICKET ID
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.08em' }}>
            {result.ticketId}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)', maxWidth: 600, margin: '0 auto var(--space-8)', textAlign: 'left',
        }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>CATEGORY</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{result.category}</div>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>SEVERITY</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-critical)' }}>{result.severity}</div>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>STATUS</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-reported)' }}>Reported</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/track" className="btn btn-secondary btn-lg">
            <CheckCircle size={18} />
            Track Complaint
          </Link>
          <Link href="/map" className="btn btn-secondary btn-lg">
            <MapPin size={18} />
            View on City Map
          </Link>
          <button className="btn btn-primary btn-lg" onClick={() => { setResult(null); setForm(INITIAL_FORM); }}>
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN MULTIMODAL REPORT FORM ──────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* ── STEP 1: PHOTO UPLOAD & GEMINI VISION ──────────── */}
        <div className="card-elevated" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-purple)' }}>
              <Camera size={20} />
              Step 1: Upload Photo for Gemini AI Vision
            </h3>
            <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Sparkles size={12} style={{ marginRight: 4 }} />
              Auto-Classification
            </span>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Take or upload a photo of the civic issue. Gemini Multimodal Vision will automatically identify the category, severity, and responsible NMC department.
          </p>

          {/* Upload Dropzone */}
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(139,92,246,0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(139,92,246,0.03)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(139,92,246,0.03)'; }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)',
                color: 'var(--accent-purple)'
              }}>
                <Upload size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 4 }}>
                Click to upload photo or drag & drop
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Supports JPG, PNG, WEBP (Max 10MB)
              </div>

              {/* Sample Images for quick demo */}
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Or test with:</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadSampleImage('pothole')} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  🛣️ Sample Pothole
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadSampleImage('garbage')} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  🗑️ Sample Garbage
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadSampleImage('drainage')} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  🚰 Sample Drainage
                </button>
              </div>
            </div>
          ) : (
            /* Image Preview Card */
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 140, height: 105, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Uploaded civic issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} style={{ color: 'var(--accent-purple)' }} />
                  Photo Attached
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                  Ready for AI verification and civic dispatch.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => triggerGeminiAnalysis(imagePreview, imageMimeType, userNotes)}
                    disabled={isAnalyzing}
                  >
                    <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                    Re-Analyze with Gemini
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setImagePreview(null); setAiAnalysis(null); }}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User contextual notes */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>
              Optional Context / Voice Note (English, हिंदी, मराठी, Hinglish)
            </label>
            <input
              type="text"
              className="form-input"
              value={userNotes}
              onChange={e => setUserNotes(e.target.value)}
              placeholder="e.g. 'Near Ward 12 bus stop, dangerous at night' or 'रस्त्यावर मोठा खड्डा आहे'"
            />
          </div>

          {/* Live AI Scanning State */}
          {isAnalyzing && (
            <div style={{
              marginTop: 'var(--space-4)', padding: 'var(--space-5)',
              background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(139,92,246,0.25)', textAlign: 'center'
            }}>
              <div className="loading-spinner" style={{ width: 28, height: 28, margin: '0 auto var(--space-3)', borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }} />
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-purple)', marginBottom: 4 }}>
                {analysisStep === 1 && '🔍 Inspecting visual image features...'}
                {analysisStep === 2 && '🤖 Gemini Multimodal AI classifying civic category...'}
                {analysisStep >= 3 && '📊 Assessing severity & mapping to NMC Department...'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Powered by Gemini 3.6 Flash Multimodal Intelligence
              </div>
            </div>
          )}

          {/* AI Analysis Result Card */}
          {aiAnalysis && !isAnalyzing && (
            <div style={{
              marginTop: 'var(--space-4)', padding: 'var(--space-5)',
              background: 'rgba(139,92,246,0.06)', borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(139,92,246,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--accent-purple)' }}>
                    Gemini AI Vision Assessment
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px' }}>
                    {Math.round((aiAnalysis.confidence || 0.9) * 100)}% Confidence
                  </span>
                  <span className={`badge severity-${(aiAnalysis.severity || 'medium').toLowerCase()}`}>
                    {aiAnalysis.severity} Severity
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                {aiAnalysis.title}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
                {aiAnalysis.description}
              </div>

              {/* Department recommendation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', marginBottom: 'var(--space-3)' }}>
                <Building size={14} />
                <span>Recommended Department: <strong>{aiAnalysis.department}</strong></span>
              </div>

              {/* Evidence list */}
              {aiAnalysis.evidence && aiAnalysis.evidence.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {aiAnalysis.evidence.map((ev, i) => (
                    <span key={i} style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      • {ev}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Error / Fallback message */}
          {aiError && (
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>
              ⚡ {aiError}
            </div>
          )}
        </div>

        {/* ── STEP 2: CATEGORY SELECTION (EDITABLE) ────────── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} style={{ color: 'var(--accent-blue)' }} />
            Step 2: Confirm Issue Category
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${form.category === cat ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: form.category === cat ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
                  color: form.category === cat ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 'var(--text-sm)',
                  fontWeight: form.category === cat ? 700 : 400,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── STEP 3: DETAILS & SEVERITY ───────────────────── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
            Step 3: Review & Refine Details
          </h3>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Issue Title</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={form.title}
                onChange={handleChange}
                placeholder="Brief title (e.g. Large pothole near Bus Stand)"
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description *</label>
              <textarea
                name="description"
                className="form-textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the civic issue in detail. Include landmarks, size of problem, how long it has existed, and any safety concerns."
                required
                minLength={10}
                style={{ minHeight: 110 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <div className="flex gap-3 flex-wrap">
                {SEVERITY_LIST.map(sev => {
                  const colors: Record<string, string> = { Low: 'var(--color-low)', Medium: 'var(--color-medium)', High: 'var(--color-high)', Critical: 'var(--color-critical)' };
                  const isSelected = form.severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, severity: sev }))}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? colors[sev] : 'var(--border-subtle)'}`,
                        background: isSelected ? `${colors[sev]}20` : 'transparent',
                        color: isSelected ? colors[sev] : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 400,
                        fontSize: 'var(--text-sm)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 4: LOCATION & GEOLOCATION ──────────────── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} style={{ color: 'var(--accent-blue)' }} />
              Step 4: Location & Geospatial Tagging
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleUseCurrentLocation}
              disabled={locating}
            >
              <Navigation size={14} className={locating ? 'animate-spin' : ''} />
              {locating ? 'Locating GPS...' : 'Use My GPS Location'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Zone</label>
              <select name="zone" className="form-select" value={form.zone} onChange={handleChange}>
                <option value="">Select Nagpur Zone</option>
                {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ward Number (1–156)</label>
              <input
                type="number"
                name="wardNumber"
                className="form-input"
                value={form.wardNumber}
                onChange={handleChange}
                placeholder="e.g. 12"
                min={1}
                max={156}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Locality / Landmark</label>
              <input
                type="text"
                name="locality"
                className="form-input"
                value={form.locality}
                onChange={handleChange}
                placeholder="e.g. Opposite Sitabuldi Metro Station, Wardha Road"
              />
            </div>
            {form.latitude && form.longitude && (
              <div style={{ gridColumn: '1 / -1', fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <CheckCircle size={14} />
                GPS Coordinates Attached: {form.latitude}, {form.longitude} (Will be plotted on City Map)
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 5: CONTACT (OPTIONAL) ──────────────────── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={18} style={{ color: 'var(--accent-blue)' }} />
            Step 5: Contact (Optional)
          </h3>
          <div className="form-group">
            <label className="form-label">Citizen Mobile Number</label>
            <input
              type="tel"
              name="contactPhone"
              className="form-input"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="+91 98XXX XXXXX"
              style={{ maxWidth: 300 }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 4, display: 'block' }}>
              Used exclusively for NMC resolution SMS updates.
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: 'var(--space-4)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ── SUBMIT BUTTON ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || isAnalyzing}>
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                Registering Complaint...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Confirm & Report Civic Issue
              </>
            )}
          </button>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Real ticket ID will be generated and dispatched to NMC.
          </div>
        </div>
      </div>
    </form>
  );
}
