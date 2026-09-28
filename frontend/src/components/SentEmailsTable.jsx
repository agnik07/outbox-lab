import React from 'react';
import { CheckCircle2, ExternalLink, AlertTriangle, Mail } from 'lucide-react';

export default function SentEmailsTable({ emails }) {
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
        <Mail size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, color: '#f8fafc', marginBottom: 4 }}>No Sent Emails Yet</h3>
        <p style={{ fontSize: 13 }}>Once scheduled timers expire, delivered emails will be listed here.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color="#10b981" /> Sent Log ({emails.length})
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real SMTP Delivery Logs</span>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Sent At</th>
              <th style={{ textAlign: 'right' }}>Ethereal Preview</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => {
              const isSent = email.status === 'SENT';
              return (
                <tr key={email.id}>
                  <td>
                    {isSent ? (
                      <span className="badge badge-sent">
                        <CheckCircle2 size={12} /> Sent
                      </span>
                    ) : (
                      <span className="badge badge-failed" title={email.errorMessage}>
                        <AlertTriangle size={12} /> {email.status}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{email.recipient}</td>
                  <td>{email.subject}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {email.sentAt
                      ? new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {email.etherealUrl ? (
                      <a
                        href={email.etherealUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12, color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                      >
                        <span>View Email</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
