import React, { useState, useEffect } from 'react';
import { Clock, Ban, Calendar, AlertCircle } from 'lucide-react';

function CountdownTimer({ scheduledAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Processing now...');
      } else {
        const sec = Math.ceil(diff / 1000);
        if (sec < 60) {
          setTimeLeft(`Sends in ${sec}s`);
        } else {
          const min = Math.floor(sec / 60);
          const remSec = sec % 60;
          setTimeLeft(`Sends in ${min}m ${remSec}s`);
        }
      }
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  const isNear = new Date(scheduledAt).getTime() - Date.now() < 5000;

  return (
    <span
      className="badge badge-scheduled"
      style={{
        background: isNear ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)',
        borderColor: isNear ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.25)'
      }}
    >
      <Clock size={12} />
      {timeLeft}
    </span>
  );
}

export default function ScheduledEmailsTable({ emails, onCancel }) {
  if (!emails || emails.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}
      >
        <Calendar size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, color: '#f8fafc', marginBottom: 4 }}>No Scheduled Emails</h3>
        <p style={{ fontSize: 13 }}>Click "Schedule Email" or "Load Test Batch" to queue future emails.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="#f59e0b" /> Scheduled Queue ({emails.length})
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-refreshing every 2s</span>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Status / Timer</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Scheduled For</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr key={email.id}>
                <td>
                  <CountdownTimer scheduledAt={email.scheduledAt} />
                </td>
                <td style={{ fontWeight: 600 }}>{email.recipient}</td>
                <td>{email.subject}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(email.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => onCancel(email.id)}
                    title="Cancel Job"
                  >
                    <Ban size={14} /> Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
