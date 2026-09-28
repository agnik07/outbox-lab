import React, { useState } from 'react';
import { Mail, Lock, LogIn, Key, ShieldCheck } from 'lucide-react';

export default function LoginModal({ isOpen, onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onLogin({ username, password });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 420, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              marginBottom: 16
            }}
          >
            <Mail size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#f8fafc' }}>Outbox Lab Login</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Sign in to manage scheduled emails & queue metrics
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 16,
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={isSubmitting}>
            <LogIn size={18} />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-color)',
            fontSize: 12,
            color: 'var(--text-dim)',
            textAlign: 'center'
          }}
        >
          <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Demo Credentials: <strong>admin</strong> / <strong>password123</strong>
        </div>
      </div>
    </div>
  );
}
