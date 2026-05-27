'use client';

import { useState } from 'react';
import { useWatchlistStore } from '@/stores/watchlist';
import { useTickerStore } from '@/stores/ticker';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { Star, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { Exchange } from '@crypto-screener/shared';

export default function WatchlistPage() {
  const { watchlists, activeWatchlistId, addWatchlist, removeWatchlist, renameWatchlist, removeSymbol, setActiveWatchlist } = useWatchlistStore();
  const tickers = useTickerStore((s) => s.tickers);
  const openCoinDetail = useCoinDetailStore((s) => s.openCoinDetail);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Watchlists</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
          <Plus size={14} /> New List
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Watchlist name..."
            className="flex-1 px-3 py-1.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            autoFocus
          />
          <button onClick={() => { if (newName.trim()) { addWatchlist(newName.trim()); setNewName(''); setShowCreate(false); } }} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg">Create</button>
          <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg">Cancel</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {watchlists.map((w) => (
          <div key={w.id} className="flex items-center gap-1">
            {renamingId === w.id ? (
              <div className="flex gap-1">
                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="px-2 py-1 text-sm bg-input border border-border rounded" autoFocus onBlur={() => { renameWatchlist(w.id, renameValue); setRenamingId(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { renameWatchlist(w.id, renameValue); setRenamingId(null); } }} />
              </div>
            ) : (
              <button
                onClick={() => setActiveWatchlist(w.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  activeWatchlist?.id === w.id ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-foreground-muted hover:border-primary'
                }`}
              >
                {w.name}
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{w.symbols.length}</span>
              </button>
            )}
            <button onClick={() => { setRenamingId(w.id); setRenameValue(w.name); }} className="p-1 text-foreground-muted hover:text-primary"><Edit2 size={12} /></button>
            <button onClick={() => removeWatchlist(w.id)} className="p-1 text-foreground-muted hover:text-destructive"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      {activeWatchlist && (
        <div className="space-y-1">
          {activeWatchlist.symbols.map((symbol) => {
            const ticker = Array.from(tickers.values()).find((t) => t.symbol === symbol || t.normalizedSymbol === symbol);
            return (
              <div
                key={symbol}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-hover cursor-pointer group"
                onClick={() => openCoinDetail(symbol, (ticker?.exchange as Exchange) || 'binance')}
              >
                <Star size={16} className="text-warning fill-warning" />
                <span className="font-medium flex-1">{symbol}</span>
                {ticker && (
                  <>
                    <span className="text-foreground-muted text-sm">{ticker.exchange}</span>
                    <span className="font-mono text-sm">${ticker.price?.toFixed(2)}</span>
                    <span className={`font-mono text-sm ${(ticker.priceChangePercent24h ?? 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {(ticker.priceChangePercent24h ?? 0) >= 0 ? '+' : ''}{(ticker.priceChangePercent24h ?? 0).toFixed(2)}%
                    </span>
                  </>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeSymbol(activeWatchlist.id, symbol); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-foreground-muted hover:text-destructive transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          {activeWatchlist.symbols.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              <p>This watchlist is empty</p>
              <p className="text-sm">Click the star icon on any coin to add it</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
