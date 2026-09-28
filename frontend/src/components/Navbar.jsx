import React from 'react';
import { Mail, Zap, RefreshCw, LogOut, User, Cpu } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  onOpenCompose,
  onOpenBatch,
  onRefresh,
  isRefreshing,
  serverHealthy
}) {
  return (
    <header className="glass-panel" style={{ marginBottom: 24, padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Logo & System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Mail size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>Outbox Lab</h1>
              <span
                className="badge"
                style={{
                  background: serverHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: serverHealthy ? '#6ee7b7' : '#fca5a5',
                  border: serverHealthy ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                }}
              >
                <span className="pulse-dot" style={{ backgroundColor: serverHealthy ? '#10b981' : '#f43f5e' }} />
                {serverHealthy ? 'Express + Redis UP' : 'Server Disconnected'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              BullMQ Email Scheduler & Rate-Limiting Engine
            </p>
          </div>
        </div>

        {/* Action Buttons & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh Data"
            style={{ padding: '10px 14px' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button className="btn btn-accent" onClick={onOpenBatch}>
            <Zap size={16} />
            <span>Load Test Batch</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenCompose}>
            <Mail size={16} />
            <span>Schedule Email</span>
          </button>

          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 12,
                borderLeft: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                <User size={14} color="#a5b4fc" />
                <span>{user.name || user.username}</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={onLogout}
                title="Logout"
                style={{ padding: '8px 12px', color: '#94a3b8' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
