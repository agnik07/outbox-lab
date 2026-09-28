import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import ScheduledEmailsTable from './components/ScheduledEmailsTable';
import SentEmailsTable from './components/SentEmailsTable';
import ComposeEmailModal from './components/ComposeEmailModal';
import BatchScheduleModal from './components/BatchScheduleModal';
import { Search } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

export default function App() {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState(null);
  const [config, setConfig] = useState(null);
  const [ethereal, setEthereal] = useState(null);

  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [serverHealthy, setServerHealthy] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Stats & Queue Info
      const statsRes = await fetch(`${API_BASE}/emails/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setQueue(statsData.queue);
        setConfig(statsData.config);
        setEthereal(statsData.ethereal);
        setServerHealthy(true);
      } else {
        setServerHealthy(false);
      }

      // 2. Fetch Scheduled Emails
      const scheduledRes = await fetch(`${API_BASE}/emails?status=SCHEDULED`);
      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json();
        setScheduledEmails(scheduledData.emails || []);
      }

      // 3. Fetch Sent / Failed / Cancelled Emails
      const sentRes = await fetch(`${API_BASE}/emails?limit=200`);
      if (sentRes.ok) {
        const sentData = await sentRes.json();
        const nonScheduled = (sentData.emails || []).filter((e) => e.status !== 'SCHEDULED');
        setSentEmails(nonScheduled);
      }
    } catch (err) {
      setServerHealthy(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleScheduleSingle = async ({ recipient, subject, body, delaySeconds }) => {
    const res = await fetch(`${API_BASE}/emails/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, subject, body, delaySeconds })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Scheduled email to ${recipient} in ${delaySeconds}s!`, 'success');
      fetchData();
    } else {
      showToast(`Error: ${data.message}`, 'error');
    }
  };

  const handleScheduleBatch = async ({ count, delaySeconds }) => {
    const res = await fetch(`${API_BASE}/emails/schedule-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, delaySeconds })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Dispatched batch of ${count} emails with ${delaySeconds}s delay!`, 'success');
      fetchData();
    } else {
      showToast(`Error: ${data.message}`, 'error');
    }
  };

  const handleCancelEmail = async (id) => {
    const res = await fetch(`${API_BASE}/emails/${id}/cancel`, {
      method: 'POST'
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Cancelled scheduled email.', 'info');
      fetchData();
    } else {
      showToast(`Failed to cancel: ${data.message}`, 'error');
    }
  };

  const filteredScheduled = scheduledEmails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentEmails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            padding: '12px 20px',
            borderRadius: 12,
            background: toast.type === 'error' ? '#f43f5e' : toast.type === 'success' ? '#10b981' : '#6366f1',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            animation: 'modalIn 0.2s ease'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        serverHealthy={serverHealthy}
      />

      {/* Metric Cards */}
      <DashboardStats stats={stats} queue={queue} config={config} />

      {/* Search Bar & Filter Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 480 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by recipient or subject line..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', background: 'transparent', border: 'none' }}
          />
        </div>

        {ethereal && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Ethereal SMTP Account:</span>
            <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, color: '#a5b4fc' }}>
              {ethereal.user}
            </code>
          </div>
        )}
      </div>

      {/* Tables Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <ScheduledEmailsTable emails={filteredScheduled} onCancel={handleCancelEmail} />
        <SentEmailsTable emails={filteredSent} />
      </div>

      {/* Modals */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={handleScheduleSingle}
      />

      <BatchScheduleModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSubmit={handleScheduleBatch}
      />
    </div>
  );
}
