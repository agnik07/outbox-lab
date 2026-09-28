import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Cpu, Gauge, Layers } from 'lucide-react';

export default function DashboardStats({ stats, queue, config }) {
  const cards = [
    {
      title: 'Scheduled',
      value: stats?.scheduled || 0,
      subtext: 'In queue / pending delayed trigger',
      icon: Clock,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    {
      title: 'Sent Successfully',
      value: stats?.sent || 0,
      subtext: 'Delivered via Ethereal SMTP',
      icon: CheckCircle2,
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    {
      title: 'Failed / Cancelled',
      value: (stats?.failed || 0) + (stats?.cancelled || 0),
      subtext: `${stats?.failed || 0} failed • ${stats?.cancelled || 0} cancelled`,
      icon: AlertTriangle,
      color: '#f43f5e',
      bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.03) 100%)',
      borderColor: 'rgba(244, 63, 94, 0.3)'
    },
    {
      title: 'Queue & Rate Limiter',
      value: `${config?.rateLimitMax || 10} / sec`,
      subtext: `BullMQ Concurrency: ${config?.workerConcurrency || 5} workers`,
      icon: Gauge,
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.03) 100%)',
      borderColor: 'rgba(6, 182, 212, 0.3)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}
    >
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className="glass-panel"
            style={{
              padding: '20px 24px',
              background: card.bgGradient,
              border: `1px solid ${card.borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.title}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent size={20} color={card.color} />
              </div>
            </div>

            <div style={{ fontSize: 32, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              {card.value}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
