import React, { useState } from 'react';
import { X, Clock, Send, Sparkles } from 'lucide-react';

export default function ComposeEmailModal({ isOpen, onClose, onSubmit }) {
  const [recipient, setRecipient] = useState('user@example.com');
  const [subject, setSubject] = useState('Scheduled Email Reminder');
  const [body, setBody] = useState('Hello! This is a test scheduled email dispatched from Outbox Lab.');
  const [delaySeconds, setDelaySeconds] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient || !subject || !body) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        recipient,
        subject,
        body,
        delaySeconds
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetDelays = [
    { label: '+10 sec', sec: 10 },
    { label: '+30 sec', sec: 30 },
    { label: '+1 min', sec: 60 },
    { label: '+5 min', sec: 300 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={20} color="#a5b4fc" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>Schedule Email</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Configure recipient and dispatch timer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Recipient Email Address
            </label>
            <input
              type="email"
              className="input-field"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. mitrajit@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Subject Line
            </label>
            <input
              type="text"
              className="input-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Email Body Content
            </label>
            <textarea
              className="input-field"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here..."
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              Schedule Dispatch Delay
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {presetDelays.map((preset) => (
                <button
                  key={preset.sec}
                  type="button"
                  className={`btn ${delaySeconds === preset.sec ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 4px', fontSize: 13, justifyContent: 'center' }}
                  onClick={() => setDelaySeconds(preset.sec)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                className="input-field"
                min="0"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>seconds from now</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Send size={16} />
              <span>{isSubmitting ? 'Scheduling...' : 'Schedule Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
