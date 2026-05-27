# Crypto Screener — Premium UI Layout Plan
> Inspired by Scalpboard.io · Dark glassmorphism · Professional trading terminal

---

## 1. GLOBAL LAYOUT STRUCTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TOP BAR (h: 52px, fixed)                         │
│  [Logo] [Search] .............. [Exchange] [TF] [Grid] [Alerts] [⚙] │
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ N  │                                                                 │
│ A  │                                                                 │
│ V  │                 MAIN CONTENT AREA                               │
│    │            (flex-1, scrollable if needed)                       │
│ B  │                                                                 │
│ A  │                                                                 │
│ R  │                                                                 │
│    │                                                                 │
│w:64│                                                                 │
│    │                                                                 │
├────┴─────────────────────────────────────────────────────────────────┤
│               BOTTOM STATUS BAR (h: 28px, fixed)                     │
│  [WS: Connected] [Exchange: Binance] [Latency: 12ms] [Time: 14:32]  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. TOP BAR (Header) — h: 52px

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [◇ SCREENER]  [🔍 Search coins...       ]  [BNB▾] [1m▾] [⊞4▾]     │
│       Logo          Search Input (max-w:400px)    Exch  TF   Grid    │
│                                                     │     │    │     │
│                                      ┌──────────────┘     │    │     │
│                                      ▼                    ▼    ▼     │
│                                  Dropdown            Dropdown Dropdown│
│                                                                      │
│                              [🔔3] [⭐] [⛶] [⚙]                     │
│                               Alert Watch Full  Settings              │
│                               Badge list screen                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Top Bar Elements:
| # | Element | Size | Icon | Behavior |
|---|---------|------|------|----------|
| 1 | **Logo** | 40×40px | ◇ custom | Links to `/` home |
| 2 | **Search** | flex, max 400px | `Search` lucide | Fuzzy search coins, modal dropdown with results |
| 3 | **Exchange Select** | 100px | `ArrowLeftRight` | Dropdown: Binance, Bybit, OKX, Bitget, Gate |
| 4 | **Timeframe Select** | 70px | `Clock` | Dropdown: 1m, 5m, 15m, 1h, 4h, 1d |
| 5 | **Grid Layout** | 80px | `Grid2x2`, `LayoutGrid` | Dropdown: 1, 4, 6, 9 charts |
| 6 | **Alerts** | 36×36px | `Bell` | Badge with unread count, click → alerts panel |
| 7 | **Watchlist** | 36×36px | `Star` | Quick watchlist toggle overlay |
| 8 | **Fullscreen** | 36×36px | `Maximize2` | Toggle browser fullscreen |
| 9 | **Settings** | 36×36px | `Settings` | Navigate to `/settings` |

---

## 3. NAVIGATION BAR (Left Sidebar) — w: 64px, expanded on hover: 220px

```
┌──────┐
│      │
│  ◈   │  ← Logo/Brand icon (40×40, centered)
│      │
├──────┤
│      │
│  📊  │  Dashboard   (/)
│  📈  │  Charts      (/charts)
│  🔍  │  Screener    (/screener)
│  🟥  │  Heatmap     (/heatmap)
│  🧩  │  Patterns    (/patterns)
│  🔔  │  Alerts      (/alerts)     [3 badge]
│  ⭐  │  Watchlist   (/watchlist)
│      │
├──────┤
│      │
│  ⚙  │  Settings    (/settings)
│      │
└──────┘
```

### Nav Bar Interaction:
- **Collapsed state** (default): 64px width, icons only, tooltips on hover
- **Expanded state** (hover): 220px width, slides out with `Framer Motion`
- **Active page**: accent glow left border (3px solid `var(--primary)`)
- **Hover effect**: background glass highlight `rgba(255,255,255,0.05)`
- **Badge** (alerts): red dot / count pill on top-right of icon

### Nav Icons (lucide-react):
| Page | Icon |
|------|------|
| Dashboard | `LayoutDashboard` |
| Charts | `CandlestickChart` or `BarChart3` |
| Screener | `Filter` or `ScanLine` |
| Heatmap | `Grid3x3` |
| Patterns | `Puzzle` or `TrendingUp` |
| Alerts | `BellRing` |
| Watchlist | `Star` |
| Settings | `Settings` |

---

## 4. PAGE 1: DASHBOARD (`/`) — Home

The main working screen. Split layout with resizable panels.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
├────┬─────────────────────────────────────────────────────────────────┤
│    │  ┌─── Coin Sidebar (320px, collapsible) ──┬── Chart Grid ──────┤
│ N  │  │ [Spot▾] [Futures▾]  [🔍 search    ]   │                    │
│ A  │  │ ┌──────────────────────────────────┐   │  ┌────────┬───────┤
│ V  │  │ │ Symbol  Price    24h%   Vol      │   │  │ BTC    │ ETH   │
│    │  │ │ ★ BTC   $67,420  +2.3%  $1.2B    │   │  │ Chart  │ Chart │
│ B  │  │ │ ★ ETH   $3,520   -1.1%  $800M    │   │  │        │       │
│ A  │  │ │   SOL   $178.5   +5.7%  $450M    │   │  ├────────┼───────┤
│ R  │  │ │   BNB   $612     +0.8%  $320M    │   │  │ SOL    │ DOGE  │
│    │  │ │   XRP   $0.62    -0.4%  $280M    │   │  │ Chart  │ Chart │
│    │  │ │   DOGE  $0.163   +3.2%  $210M    │   │  │        │       │
│    │  │ │   ADA   $0.48    +1.5%  $150M    │   │  └────────┴───────┘
│    │  │ │   ...   ...      ...    ...      │   │                    │
│    │  │ │   (Virtual Scroll, ~500 items)    │   │                    │
│    │  │ └──────────────────────────────────┘   │                    │
├────┴──┴────────────────────────────────────────┴────────────────────┤
│                         STATUS BAR                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Coin Sidebar (Left Panel, 320px):
- **Market Toggle**: Spot / Futures pill buttons
- **Search Input**: fuzzy filter by symbol
- **Min Volume Filter**: slider or input
- **Exchange Filter**: multi-select chips
- **Column Headers** (sortable):
  - ⭐ (watchlist star, 32px)
  - Symbol (100px) — with small exchange badge
  - Price (90px) — flash green/red on change
  - 24h% (70px) — colored badge green/red
  - Volume (80px)
- **Row**: 44px height, hover highlight, click → open CoinDetail
- **Virtual scroll** with @tanstack/react-virtual
- **Resizable** width (drag handle on right edge)

### Chart Grid (Right Area):
- Cells: 1×1, 2×2, 2×3, 3×3 configurable
- Each chart cell:
  ```
  ┌─────────────────────────────┐
  │ BTC/USDT  Binance  1h  □ ✕ │  ← Header (32px)
  │ ┌─────────────────────────┐ │
  │ │                         │ │
  │ │    TradingView Chart    │ │  ← Chart body (flex)
  │ │    (lightweight-charts) │ │
  │ │                         │ │
  │ └─────────────────────────┘ │
  │ Vol: 1.2B  Trades: 45K     │  ← Footer (28px)
  │ High: 68,100  Low: 66,800  │
  └─────────────────────────────┘
  ```
- Header: symbol, exchange badge, timeframe selector, fullscreen, close
- Footer: volume, trades count, 24h high/low, spread

---

## 5. PAGE 2: SCREENER (`/screener`)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ N  │  ┌─ Quick Filter Pills ─────────────────────────────────────┐  │
│ A  │  │ [🔥 Top Gainers] [📉 Losers] [📊 Volume] [⚡ Volatility] │  │
│ V  │  │ [💎 OI Change] [💰 Funding] [🎯 Breakout]                │  │
│    │  └──────────────────────────────────────────────────────────┘  │
│ B  │                                                                 │
│ A  │  ┌─ Active Filters ─────────────────────────────────────────┐  │
│ R  │  │ [Binance ×] [Volume > $100M ×] [24h > 5% ×]   [Clear All]│  │
│    │  └──────────────────────────────────────────────────────────┘  │
│    │                                                                 │
│    │  ┌─ Exchange Chips ─┐  ┌─ Search ────────────────────────┐    │
│    │  │ [Binance][Bybit]  │  │  🔍 Filter coins...              │    │
│    │  │ [OKX][Bitget]     │  └────────────────────────────────┘    │
│    │  └──────────────────┘                                          │
│    │                                                                 │
│    │  ┌─ Results Table ──────────────────────────────────────────┐  │
│    │  │ # │ Symbol │ Price │ 24h% │ Volume │ OI │ Funding │ ... │  │
│    │  │───┼────────┼───────┼──────┼────────┼────┼─────────┤     │  │
│    │  │ 1 │ BTC    │67,420 │+2.3% │ $1.2B  │ +5%│ 0.012%  │     │  │
│    │  │ 2 │ ETH    │3,520  │-1.1% │ $800M  │ +3%│ 0.008%  │     │  │
│    │  │ 3 │ SOL    │178.5  │+5.7% │ $450M  │+12%│ 0.025%  │     │  │
│    │  │...│ ...    │ ...   │ ...  │ ...    │ ...│ ...     │     │  │
│    │  └──────────────────────────────────────────────────────────┘  │
│    │                                                                 │
├────┴─────────────────────────────────────────────────────────────────┤
│                         STATUS BAR                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Screener Elements:
- **Quick Filters**: Pill buttons with icons, active = accent bg glow
- **Active Filter Tags**: removable chips with `×` button
- **Exchange Chips**: toggle multi-select
- **Results Table**: sortable columns, click row → CoinDetail modal
- **Columns**: Symbol, Price, 24h%, Volume, OI Change, Funding Rate, Volatility, Trades, Spread

---

## 6. PAGE 3: HEATMAP (`/heatmap`)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ N  │  ┌─ Controls ───────────────────────────────────────────────┐  │
│ A  │  │ [Market Cap▾] [24h Change▾] [Volume▾]  [Spot▾] [Futures▾]│  │
│ V  │  └──────────────────────────────────────────────────────────┘  │
│    │                                                                 │
│ B  │  ┌─ Treemap Heatmap ────────────────────────────────────────┐  │
│ A  │  │                                                          │  │
│ R  │  │  ┌────────┐┌──────┐┌──────┐┌────┐┌────┐                 │  │
│    │  │  │  BTC   ││ ETH  ││ BNB  ││XRP ││SOL │                 │  │
│    │  │  │$67,420 ││$3,520││$612  ││$0.6││$178│                 │  │
│    │  │  │ +2.3%  ││-1.1% ││+0.8% ││-0.4││+5.7│                 │  │
│    │  │  │ (green)││ (red)││(lgreen)│(red)│(gre)│                 │  │
│    │  │  │        ││      ││      ││    ││    │                  │  │
│    │  │  └────────┘└──────┘└──────┘└────┘└────┘                  │  │
│    │  │  ┌────┐┌────┐┌────┐┌──┐┌──┐┌──┐┌──┐┌──┐                │  │
│    │  │  │ADA ││DOGE││AVAX││LNK││DOT││MTC││UNI││AAV│             │  │
│    │  │  └────┘└────┘└────┘└──┘└──┘└──┘└──┘└──┘                 │  │
│    │  │                                                          │  │
│    │  └──────────────────────────────────────────────────────────┘  │
│    │                                                                 │
│    │  ┌─ Legend ──────────────────────────────────────────────────┐  │
│    │  │ ■ > +10%  ■ +5-10%  ■ +1-5%  ■ 0%  ■ -1-5%  ■ < -5%   │  │
│    │  └──────────────────────────────────────────────────────────┘  │
├────┴─────────────────────────────────────────────────────────────────┤
│                         STATUS BAR                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Heatmap Design:
- **Treemap layout**: sized by market cap, colored by % change
- **Color gradient**: deep green (#00C853) → dark gray → deep red (#FF1744)
- **Hover**: tooltip with full details (symbol, price, change, volume, cap)
- **Click**: opens CoinDetail modal
- **Legend bar**: bottom of heatmap area

---

## 7. PAGE 4: PATTERNS (`/patterns`)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ N  │  ┌─ Filters Bar ─────────────────────────────────────────────┐ │
│ A  │  │ [Pattern Type▾] [Timeframe▾] [Direction▾] [Exchange▾]     │ │
│ V  │  │ [Sort: Confidence▾]          [🔄 Refresh]                  │ │
│ B  │  └──────────────────────────────────────────────────────────┘  │
│ A  │                                                                 │
│ R  │  ┌─ Pattern Cards Grid (3 columns) ──────────────────────────┐ │
│    │  │                                                            │ │
│    │  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │ │
│    │  │ │ BTC/USDT     │ │ ETH/USDT     │ │ SOL/USDT     │       │ │
│    │  │ │ 🔺 Double Btm│ │ 🔻 Head&Shld │ │ 🔺 Asc Tri   │       │ │
│    │  │ │ 1H · Binance │ │ 4H · Bybit   │ │ 1D · OKX     │       │ │
│    │  │ │              │ │              │ │              │       │ │
│    │  │ │ ████████░░   │ │ ██████░░░░   │ │ ██████████   │       │ │
│    │  │ │ Confidence 82%│ │ Confidence 65%│ │ Confidence 95%│       │ │
│    │  │ │              │ │              │ │              │       │ │
│    │  │ │ Target: 69K  │ │ Target: 3.2K │ │ Target: 220  │       │ │
│    │  │ │ SL: 65.5K    │ │ SL: 3.6K     │ │ SL: 155      │       │ │
│    │  │ │ R:R = 2.3:1  │ │ R:R = 1.8:1  │ │ R:R = 3.1:1  │       │ │
│    │  │ └──────────────┘ └──────────────┘ └──────────────┘       │ │
│    │  │                                                            │ │
│    │  └──────────────────────────────────────────────────────────┘  │
├────┴─────────────────────────────────────────────────────────────────┤
│                         STATUS BAR                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. PAGE 5: ALERTS (`/alerts`)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ N  │  ┌─ Controls ────────────────────────────────────────────────┐ │
│ A  │  │ [All▾] [Type▾] [Severity▾] [Unread only ☑]               │ │
│ V  │  │                                        [Mark All Read ✓]  │ │
│ B  │  └──────────────────────────────────────────────────────────┘  │
│ A  │                                                                 │
│ R  │  ┌─ Alert Cards ─────────────────────────────────────────────┐ │
│    │  │                                                            │ │
│    │  │ ┌──────────────────────────────────────────────────────┐  │ │
│    │  │ │ 🔴 Price Alert    BTC > $68,000           2m ago  •  │  │ │
│    │  │ │    Triggered at $68,102 on Binance                  │  │ │
│    │  │ └──────────────────────────────────────────────────────┘  │ │
│    │  │ ┌──────────────────────────────────────────────────────┐  │ │
│    │  │ │ 🟡 Pattern Alert  ETH Head & Shoulders    15m ago  • │  │ │
│    │  │ │    4H timeframe, Confidence 78%                      │  │ │
│    │  │ └──────────────────────────────────────────────────────┘  │ │
│    │  │ ┌──────────────────────────────────────────────────────┐  │ │
│    │  │ │ 🟢 Volume Spike   SOL +340% volume      1h ago      │  │ │
│    │  │ │    Current vol: $890M (avg: $200M)                   │  │ │
│    │  │ └──────────────────────────────────────────────────────┘  │ │
│    │  │                                                            │ │
│    │  └──────────────────────────────────────────────────────────┘  │
├────┴─────────────────────────────────────────────────────────────────┤
│                         STATUS BAR                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. COIN DETAIL MODAL (Overlay)

Opens on coin click from any page. Glass morphism modal.

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─ Modal (max-w: 900px, centered, glass bg) ──────────────────┐ │
│  │                                                              │ │
│  │  BTC/USDT  Binance  1H                    [🔔 Alert] [✕]   │ │
│  │  $67,420  +$1,520 (+2.30%)                                │ │
│  │                                                              │ │
│  │  ┌─────────────────��──────────────────────────────────────┐ │ │
│  │  │                                                        │ │ │
│  │  │              FULL-SIZE TRADING CHART                    │ │ │
│  │  │              (lightweight-charts)                       │ │ │
│  │  │              Candlestick / Line / Area                  │ │ │
│  │  │              + Volume bars below                        │ │ │
│  │  │                                                        │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌─ Stats Row ────────────────────────────────────────────┐ │ │
│  │  │ Vol: $1.2B │ Trades: 45K │ High: $68.1K │ Low: $66.8K │ │ │
│  │  │ Spread: 0.01% │ OI: $3.5B │ Funding: 0.012%           │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌─ Tabs ─────────────────────────────────────────────────┐ │ │
│  │  │ [OrderBook] [Trades] [Patterns] [Alerts] [Info]        │ │ │
│  │  │                                                        │ │ │
│  │  │  (tab content here)                                    │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. DESIGN SYSTEM — Premium Glass Theme

### Color Palette
```
Background:
  --bg-base:        #0a0a0f          (near-black, blue undertone)
  --bg-surface:     #12121a          (card/panel bg)
  --bg-elevated:    #1a1a28          (modals, dropdowns)
  --bg-hover:       rgba(255,255,255,0.04)

Glass:
  --glass:          rgba(18,18,26,0.85)
  --glass-strong:   rgba(18,18,26,0.95)
  --glass-border:   rgba(255,255,255,0.06)

Accent:
  --primary:        #6366f1          (indigo-500)
  --primary-glow:   rgba(99,102,241,0.15)

Semantic:
  --bullish:        #22c55e          (green-500)
  --bullish-bg:     rgba(34,197,94,0.12)
  --bearish:        #ef4444          (red-500)
  --bearish-bg:     rgba(239,68,68,0.12)
  --warning:        #f59e0b
  --muted:          #64748b

Text:
  --foreground:     #f1f5f9          (slate-100)
  --foreground-muted: #94a3b8        (slate-400)
  --foreground-secondary: #64748b    (slate-500)
```

### Glassmorphism Effects
```css
.card-glass {
  background: var(--glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
}

.card-glass-strong {
  background: var(--glass-strong);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
```

### Typography
```
Font Family:  "Inter" (primary), "JetBrains Mono" (numbers/code)
Logo:         20px, semibold
H1:           24px, semibold
H2:           18px, semibold
Body:         14px, regular
Caption:      12px, regular
Mono/Numbers: 13px, medium (tabular-nums)
```

### Spacing Scale
```
xs: 4px    sm: 8px    md: 12px    lg: 16px    xl: 24px    2xl: 32px
```

### Border Radius
```
sm: 6px    md: 8px    lg: 12px    xl: 16px    full: 9999px
```

### Animations (Framer Motion)
```
Page transitions:     fade + slide-up, 200ms ease-out
Panel expand/collapse: spring, stiffness 300, damping 30
Hover effects:        scale(1.02), 150ms
Modal open:           fade-in + scale(0.95→1), 200ms
Price flash:          bg flash green/red, 300ms fade
Dropdown:             slide-down + fade, 150ms
```

---

## 11. RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Desktop XL | ≥ 1440px | Full layout, sidebar expanded, 3×3 grid |
| Desktop | ≥ 1024px | Full layout, sidebar collapsed, 2×2 grid |
| Tablet | ≥ 768px | Nav bar → bottom tabs, sidebar hidden, 1 chart |
| Mobile | < 768px | Bottom tabs, single column, swipe navigation |

---

## 12. COMPONENT LIBRARY (UI Primitives)

| Component | Description | Variants |
|-----------|-------------|----------|
| `Button` | Glass bg, hover glow | `primary`, `secondary`, `ghost`, `danger`, sizes: `sm`, `md`, `lg` |
| `Card` | Glass container | `default`, `elevated`, `interactive` (hover) |
| `Badge` | Pill label | `bullish`, `bearish`, `neutral`, `accent` |
| `Input` | Glass bg input | With icon prefix/suffix, focus glow ring |
| `Select` | Custom dropdown | Glass bg, animated listbox |
| `Switch` | Toggle | With label, accent glow when on |
| `Tabs` | Tab navigation | Underline style, animated indicator |
| `Tooltip` | Hover info | Glass bg, arrow, delay 300ms |
| `Modal` | Overlay dialog | Glass-strong bg, backdrop blur |
| `ScrollArea` | Custom scrollbar | Thin, auto-hide, accent thumb |
| `Skeleton` | Loading state | Pulse animation, match component shape |
| `Table` | Data table | Sortable headers, hover rows, sticky header |

---

## 13. ICON USAGE GUIDE (lucide-react)

### Navigation & Actions
- `LayoutDashboard`, `CandlestickChart`, `Filter`, `Grid3x3`
- `Puzzle`, `BellRing`, `Star`, `Settings`

### Data & Indicators
- `TrendingUp`, `TrendingDown` (price direction)
- `ArrowUpRight`, `ArrowDownRight` (change %)
- `Zap` (fast/volume spike), `Activity` (live)
- `Target` (pattern target), `Shield` (stop-loss)
- `BarChart3`, `LineChart` (chart type toggle)

### Controls
- `Search`, `SlidersHorizontal` (filters)
- `Plus`, `Minus`, `X`, `Check`
- `ChevronDown`, `ChevronRight`, `ChevronLeft`
- `Eye`, `EyeOff` (visibility toggle)
- `Maximize2`, `Minimize2` (fullscreen)
- `RefreshCw` (reload data)
- `Copy`, `ExternalLink`

### Status
- `Wifi`, `WifiOff` (connection)
- `AlertTriangle`, `AlertCircle`, `Info`
- `Clock` (timeframe), `Calendar`

---

## 14. INTERACTION PATTERNS

### Price Flash Animation
```
Price UP   → bg flash: var(--bullish-bg), text: var(--bullish), 300ms
Price DOWN → bg flash: var(--bearish-bg), text: var(--bearish), 300ms
```

### Row Hover
```
bg: var(--bg-hover)
cursor: pointer
transition: background 150ms
```

### Active Nav Item
```
border-left: 3px solid var(--primary)
background: var(--primary-glow)
icon color: var(--primary)
```

### Sort Indicators
```
Ascending:  ChevronUp icon, accent color
Descending: ChevronDown icon, accent color
Inactive:   muted color, no icon
```

### Loading States
```
Initial load: full-page skeleton matching layout
Data refresh: subtle shimmer on affected cells
Chart load: chart skeleton with axis placeholders
```

---

## 15. IMPLEMENTATION PRIORITY

### Phase 1 — Core Shell (Day 1-2)
1. `globals.css` — full theme tokens (Tailwind v4 CSS-first)
2. `layout.tsx` — TopBar + NavSidebar + StatusBar + main slot
3. UI primitives: Button, Card, Badge, Input, Select, Tabs
4. NavSidebar with collapse/expand animation

### Phase 2 — Dashboard (Day 3-4)
5. CoinList sidebar with virtual scroll + real-time price flash
6. ChartGrid with lightweight-charts integration
7. Market type toggle, exchange selector, search

### Phase 3 — Coin Detail & Screener (Day 5-6)
8. CoinDetail modal with chart + stats + tabs
9. Screener page with filters + results table

### Phase 4 — Visualizations (Day 7-8)
10. Heatmap treemap view
11. Pattern detection cards

### Phase 5 — Polish (Day 9-10)
12. Alerts page + AlertPopup notifications
13. Watchlist page with tabs
14. Settings page
15. Animations, transitions, responsive
16. Performance optimization (virtual scroll tuning, WS batching)
