'use client';

import { useSettingsStore } from '@/stores/settings';
import { Exchange, Timeframe } from '@crypto-screener/shared';
import { Moon, Sun, Bell, Monitor, Send } from 'lucide-react';

export default function SettingsPage() {
  const settings = useSettingsStore();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-muted">Dark Mode</span>
          <button
            onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.theme === 'dark' ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Defaults</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Default Exchange</span>
            <select value={settings.defaultExchange} onChange={(e) => settings.setDefaultExchange(e.target.value as Exchange)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
              {Object.values(Exchange).map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Default Timeframe</span>
            <select value={settings.defaultTimeframe} onChange={(e) => settings.setDefaultTimeframe(e.target.value as Timeframe)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
              {Object.values(Timeframe).map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Chart Count</span>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={9} value={settings.defaultChartCount} onChange={(e) => settings.setDefaultChartCount(Number(e.target.value))} className="w-32" />
              <span className="text-sm font-mono w-6 text-center">{settings.defaultChartCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Bell size={18} /> Notifications</h2>
        <div className="space-y-3">
          {[
            { label: 'Sound Alerts', icon: Bell, key: 'sound' as const, toggle: () => settings.setNotificationSound(!settings.notifications.sound) },
            { label: 'Desktop Notifications', icon: Monitor, key: 'desktop' as const, toggle: () => settings.setNotificationDesktop(!settings.notifications.desktop) },
            { label: 'Telegram Notifications', icon: Send, key: 'telegram' as const, toggle: () => settings.setNotificationTelegram(!settings.notifications.telegram) },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted flex items-center gap-2"><item.icon size={14} /> {item.label}</span>
              <button
                onClick={item.toggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.notifications[item.key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications[item.key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Chart Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Candle Style</span>
            <select value={settings.chart.candleStyle} onChange={(e) => settings.setCandleStyle(e.target.value as 'candles' | 'line' | 'area')} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
              <option value="candles">Candlesticks</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
            </select>
          </div>
          {([
            { label: 'Show Volume', key: 'showVolume' as const, toggle: () => settings.setShowVolume(!settings.chart.showVolume) },
            { label: 'Show Liquidity Levels', key: 'showLiquidity' as const, toggle: () => settings.setShowLiquidity(!settings.chart.showLiquidity) },
            { label: 'Show Patterns', key: 'showPatterns' as const, toggle: () => settings.setShowPatterns(!settings.chart.showPatterns) },
            { label: 'Show Overlays', key: 'showOverlays' as const, toggle: () => settings.setShowOverlays(!settings.chart.showOverlays) },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">{item.label}</span>
              <button
                onClick={item.toggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.chart[item.key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.chart[item.key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
