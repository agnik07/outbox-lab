import React, { useState } from 'react';
import { X, Zap, Cpu, Gauge } from 'lucide-react';

export default function BatchScheduleModal({ isOpen, onClose, onSubmit }) {
  const [count, setCount] = useState(20);
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ count, delaySeconds });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={20} color="#67e8f9" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>High-Concurrency Load Test</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Demonstrate BullMQ rate limiting & worker pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Number of Emails in Batch
            </label>
            <input
              type="number"
              className="input-field"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              required
            />
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Fires {count} emails into BullMQ queue simultaneously.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Scheduled Delay (Seconds)
            </label>
            <input
              type="number"
              className="input-field"
              min="0"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
              required
            />
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              After {delaySeconds} seconds, BullMQ worker pool will process items throttled at max 10 emails/sec.
            </p>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              marginBottom: 24,
              fontSize: 13,
              color: '#a5f3fc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 4 }}>
              <Gauge size={16} /> Rate Limit Enforcement
            </div>
            The worker pool processes jobs strictly according to rate limiter rules, preventing SMTP quota limits from being exceeded.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              <Zap size={16} />
              <span>{isSubmitting ? 'Dispatching Batch...' : `Schedule Batch (${count} Emails)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
