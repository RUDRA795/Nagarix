'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, MapPin, Phone, Tag, FileText, Camera } from 'lucide-react';
import { CATEGORY_LIST, SEVERITY_LIST, NAGPUR_ZONES, getCategoryIcon } from '@/lib/utils';

interface FormData {
  category: string;
  title: string;
  description: string;
  severity: string;
  zone: string;
  wardNumber: string;
  locality: string;
  contactPhone: string;
}

interface SubmitResult {
  ticketId: string;
  department: string;
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'category' && !form.title) {
      // Auto-suggest title
    }
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
          contactPhone: form.contactPhone || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit complaint');
        return;
      }
      const data = await res.json();
      setResult({ ticketId: data.ticketId, department: data.issue?.department || 'NMC Department' });
      setForm(INITIAL_FORM);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card-elevated" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>✅</div>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>Complaint Registered!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Your civic issue has been reported and assigned to <strong>{result.department}</strong>.
        </p>
        <div style={{
          display: 'inline-block',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>YOUR TICKET ID</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
            {result.ticketId}
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
          Save this ticket ID to track your complaint status.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="btn btn-secondary" onClick={() => { window.location.href = `/track`; }}>
            Track This Complaint
          </button>
          <button className="btn btn-primary" onClick={() => setResult(null)}>
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Category Selection */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} style={{ color: 'var(--accent-blue)' }} />
            Issue Category
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
          {!form.category && error && <div className="form-error mt-2">Please select a category</div>}
        </div>

        {/* Description */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
            Issue Details
          </h3>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Title (optional)</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={form.title}
                onChange={handleChange}
                placeholder="Brief title e.g. 'Large pothole near Bus Stand'"
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the civic issue in detail. Include landmarks, size of problem, how long it has existed, and any safety concerns."
                required
                minLength={20}
                style={{ minHeight: 120 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
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

        {/* Location */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--accent-blue)' }} />
            Location
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Zone</label>
              <select name="zone" className="form-select" value={form.zone} onChange={handleChange}>
                <option value="">Select Zone</option>
                {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ward Number (if known)</label>
              <input
                type="number"
                name="wardNumber"
                className="form-input"
                value={form.wardNumber}
                onChange={handleChange}
                placeholder="1 – 156"
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
                placeholder="e.g. Near Ambazari Lake, Opposite Sitabuldi Bus Stop"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={18} style={{ color: 'var(--accent-blue)' }} />
            Contact (Optional)
          </h3>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              name="contactPhone"
              className="form-input"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              style={{ maxWidth: 280 }}
            />
            <span className="form-error" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>For status updates only. Never shared publicly.</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 'var(--space-4)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 items-center">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Submitting...</> : <><AlertTriangle size={18} /> Submit Complaint</>}
          </button>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            AI will classify and assign this issue automatically
          </div>
        </div>
      </div>
    </form>
  );
}
