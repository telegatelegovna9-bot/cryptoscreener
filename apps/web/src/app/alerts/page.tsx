'use client';

import { useAlertStore, AlertItem } from '@/stores/alert';
import { Bell, CheckCheck, Volume2, Activity, TrendingUp, TrendingDown, Zap, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';

const SEVERITY_COLORS = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-primary/20 text-primary border-primary/30',
  critical: 'bg-destructive/30 text-destructive border-destructive/40',
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  volume_spike: Volume2,
  volatility_spike: Activity,
  breakout: TrendingUp,
  pump: TrendingUp,
  dump: TrendingDown,
  funding_anomaly: Zap,
  oi_spike: Zap,
  whale_alert: TriangleAlert,
  price_cross: Bell,
};

export default function AlertsPage() {
  const { alerts, markAsRead, markAllAsRead } = useAlertStore();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const unreadCount = alerts.filter((a) => !a.read).length;

  const filtered = alerts
    .filter((a) => typeFilter === 'all' || a.type === typeFilter)
    .filter((a) => severityFilter === 'all' || a.severity === severityFilter)
    .filter((a) => readFilter === 'all' || (readFilter === 'unread' ? !a.read : a.read));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Alerts</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/20 text-destructive">{unreadCount} unread</span>
          )}
        </div>
        <button onClick={markAllAsRead} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:border-primary transition-colors">
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
          <option value="all">All Types</option>
          {Object.keys(TYPE_ICONS).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button key={f} onClick={() => setReadFilter(f)} className={`px-3 py-1.5 text-sm rounded-lg capitalize ${readFilter === f ? 'bg-primary text-white' : 'bg-card border border-border'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((alert) => {
          const Icon = TYPE_ICONS[alert.type] || Bell;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                alert.read ? 'bg-card border-border' : 'bg-card border-l-4 border-l-primary border-border'
              }`}
            >
              <Icon size={20} className={alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-warning' : 'text-primary'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{alert.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground-muted">{alert.symbol}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</span>
                </div>
                <p className="text-sm text-foreground-muted">{alert.message}</p>
                <span className="text-xs text-foreground-muted mt-1 block">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              {!alert.read && (
                <button onClick={() => markAsRead(alert.id)} className="text-xs text-foreground-muted hover:text-primary">Mark read</button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-foreground-muted">No alerts</div>
        )}
      </div>
    </div>
  );
}
