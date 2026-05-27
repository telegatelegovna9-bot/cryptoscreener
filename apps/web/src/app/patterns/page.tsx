'use client';

import { useState, useEffect } from 'react';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { DetectedPattern, Exchange, PatternType, Timeframe } from '@crypto-screener/shared';
import { Triangle, Flag, RectangleHorizontal, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

const PATTERN_ICONS: Record<string, typeof Triangle> = {
  triangle: Triangle,
  wedge: TrendingUp,
  flag: Flag,
  channel: RectangleHorizontal,
  range: Minus,
  breakout: TrendingUp,
  fakeout: TrendingDown,
  support: TrendingDown,
  resistance: TrendingUp,
  double_top: TrendingDown,
  double_bottom: TrendingUp,
  head_shoulders: TrendingDown,
  bos: TrendingUp,
  choch: TrendingDown,
  fvg: RectangleHorizontal,
  order_block: Minus,
  liquidity_sweep: TrendingUp,
};

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'latest'>('confidence');
  const openCoinDetail = useCoinDetailStore((s) => s.openCoinDetail);

  useEffect(() => {
    fetch('/api/patterns/latest?limit=100')
      .then((r) => r.json())
      .then((data) => {
        setPatterns(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = patterns
    .filter((p) => typeFilter === 'all' || p.type === typeFilter)
    .filter((p) => timeframeFilter === 'all' || p.timeframe === timeframeFilter)
    .filter((p) => directionFilter === 'all' || p.direction === directionFilter)
    .sort((a, b) => sortBy === 'confidence' ? b.confidence - a.confidence : b.timestamp - a.timestamp);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Pattern Detection</h1>
        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">{filtered.length}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
          <option value="all">All Patterns</option>
          {Object.keys(PATTERN_ICONS).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={timeframeFilter} onChange={(e) => setTimeframeFilter(e.target.value)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
          <option value="all">All Timeframes</option>
          {['1m','5m','15m','1h','4h','1d','1w'].map((tf) => <option key={tf} value={tf}>{tf}</option>)}
        </select>
        <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg">
          <option value="all">All Directions</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="neutral">Neutral</option>
        </select>
        <div className="flex gap-1">
          <button onClick={() => setSortBy('confidence')} className={`px-3 py-1.5 text-sm rounded-lg ${sortBy === 'confidence' ? 'bg-primary text-white' : 'bg-card border border-border'}`}>Confidence</button>
          <button onClick={() => setSortBy('latest')} className={`px-3 py-1.5 text-sm rounded-lg ${sortBy === 'latest' ? 'bg-primary text-white' : 'bg-card border border-border'}`}>Latest</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const Icon = PATTERN_ICONS[p.type] || Triangle;
            return (
              <div
                key={`${p.symbol}-${p.type}-${i}`}
                onClick={() => openCoinDetail(p.symbol, p.exchange as Exchange, p.timeframe as Timeframe)}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-primary" />
                    <span className="font-semibold">{p.symbol}</span>
                    <span className="text-xs text-foreground-muted">{p.exchange}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground-muted">{p.timeframe}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.direction === 'bullish' ? 'bg-bullish/20 text-bullish' :
                    p.direction === 'bearish' ? 'bg-bearish/20 text-bearish' :
                    'bg-warning/20 text-warning'
                  }`}>{p.direction}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>Confidence</span>
                    <span>{(p.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${p.confidence * 100}%` }} />
                  </div>
                </div>
                <p className="text-sm text-foreground-muted">{p.description}</p>
                {(p.targetPrice || p.stopLoss) && (
                  <div className="flex gap-4 text-xs">
                    {p.targetPrice && <span className="text-bullish">Target: ${p.targetPrice.toFixed(2)}</span>}
                    {p.stopLoss && <span className="text-bearish">SL: ${p.stopLoss.toFixed(2)}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-foreground-muted">No patterns detected</div>
      )}
    </div>
  );
}
