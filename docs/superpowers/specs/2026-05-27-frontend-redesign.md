# Crypto Screener Frontend - Design Spec

## Overview
Rebuild the full Next.js frontend for the crypto screener application. The original source code was lost; this spec is reconstructed from the compiled `.next` output and backend API analysis.

## Stack
- **Framework:** Next.js 15 App Router (standalone output)
- **Styling:** Tailwind CSS v4 (CSS-first config, dark theme)
- **State:** Zustand (7 stores, persist for settings/watchlists)
- **Data:** React Query (REST polling) + Socket.IO (real-time)
- **Charts:** lightweight-charts (candlestick/line/area)
- **Virtual scroll:** @tanstack/react-virtual
- **Animations:** Framer Motion
- **Icons:** lucide-react
- **Toasts:** sonner

## Pages (8 total)

### 1. `/` - Home Dashboard
- Left sidebar (480px): CoinList with virtual scroll
  - Spot/Futures toggle, search, min-volume filter, exchange filters
  - Sortable columns: Symbol, Price, 24h%, Volume, Trades, Spread
  - Watchlist star toggle per row
- Right area: ChartGrid (configurable 1/4/6/9 charts)
  - Each cell: TradingChart + header (symbol, exchange, timeframe, price) + footer (volume, trades, high, low)
- Overlays: CoinDetail modal, AlertPopup notifications

### 2. `/screener` - Coin Screener
- Quick filter buttons (Top Gainers, Losers, Volume, Volatility, OI, Funding)
- Exchange filters, active filter tags, search
- Results table with sortable columns
- Click opens CoinDetail modal

### 3. `/charts` - Multi-Chart View
- Full-height ChartGrid with CoinDetail and AlertPopup

### 4. `/heatmap` - Market Heatmap
- HeatmapView visualization component

### 5. `/patterns` - Pattern Detection
- Filter dropdowns (pattern type, timeframe, direction, exchange)
- Sort by confidence/latest
- Pattern cards grid with confidence bars, target/SL levels

### 6. `/alerts` - Alert Management
- Filter by type, severity, read status
- Alert cards with type icons, severity colors, mark-as-read
- Mark all read button

### 7. `/watchlist` - Watchlist Management
- Multiple watchlists with tabs
- Create/rename/delete watchlists
- Symbol list with real-time prices

### 8. `/settings` - Application Settings
- Appearance (dark/light), defaults (exchange, timeframe, chart count)
- Notifications (sound, desktop, telegram)
- Chart settings (candle style, volume, liquidity, patterns, overlays)

## State Management (Zustand Stores)

1. **tickerStore** - all tickers Map, selected exchange, market type, top gainers/losers
2. **settingsStore** - theme, defaults, notifications, chart settings (persisted)
3. **gridStore** - grid dimensions, cell configs, chart type
4. **coinDetailStore** - openCoinDetail(symbol, exchange, timeframe)
5. **watchlistStore** - multiple watchlists, active watchlist (persisted)
6. **alertStore** - alerts list, unread count, popup alerts
7. **screenerStore** - filters, results, presets, sort

## API Integration

- **REST polling:** tickers every 10s, alerts every 30s
- **WebSocket:** Socket.IO for real-time ticker/candle/orderbook/trade/alert updates
- **API client:** fetch wrapper reading `NEXT_PUBLIC_API_URL`

## Theme (Tailwind v4 CSS-first)

Custom tokens: `primary`, `bullish` (green), `bearish` (red), `warning`, `destructive`, `accent`, `card`, `border`, `input`, `muted`, `foreground-muted`, `foreground-secondary`, `background-secondary`, `glass-strong`

## Auth

Not included in this phase. All data is public. Watchlist/alerts/settings use localStorage via Zustand persist.

## File Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── screener/page.tsx
│   ├── charts/page.tsx
│   ├── heatmap/page.tsx
│   ├── patterns/page.tsx
│   ├── alerts/page.tsx
│   ├── watchlist/page.tsx
│   ├── settings/page.tsx
│   └── api/health/route.ts
├── components/
│   ├── ui/ (Card, Badge, Button, Input, Switch)
│   ├── coin-list.tsx
│   ├── chart-grid.tsx
│   ├── trading-chart.tsx
│   ├── coin-detail.tsx
│   ├── alert-popup.tsx
│   ├── heatmap-view.tsx
│   ├── pattern-card.tsx
│   └── sidebar.tsx
├── stores/
│   ├── ticker.ts
│   ├── settings.ts
│   ├── grid.ts
│   ├── coin-detail.ts
│   ├── watchlist.ts
│   ├── alert.ts
│   └── screener.ts
├── hooks/
│   ├── use-tickers.ts
│   └── use-websocket.ts
├── lib/
│   ├── api.ts
│   └── ws.ts
└── styles/
    └── (globals.css in app/)
```
