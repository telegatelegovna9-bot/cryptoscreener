# Crypto Screener — Institutional-Grade Trading Terminal

Production-grade crypto screener platform with real-time market data, live charts, liquidity heatmap, pattern detection, and alerts engine.

## Features

- **Live Chart Grid** — 1-9 configurable candlestick charts with real-time WebSocket updates
- **Smart Screener** — Advanced filtering by volume, volatility, funding, OI, and more
- **Liquidity Heatmap** — Bookmap-style visualization of order book depth, iceberg orders, spoofing detection
- **Pattern Detection** — Automatic detection of triangles, wedges, flags, BOS, CHOCH, FVG, order blocks, and more
- **Alerts Engine** — Real-time popups for listings, pumps, dumps, volume spikes, funding anomalies
- **Multi-Exchange** — Binance, Bybit, OKX, KuCoin, Bitget, Gate, MEXC, Hyperliquid, Coinbase
- **Telegram Mini App** — Full mobile-optimized Telegram WebApp with haptic feedback
- **Watchlists** — Create and manage custom coin lists
- **Candle History** — Full historical data with 7 timeframes (1m to 1W)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Zustand, TanStack Query |
| Charts | TradingView Lightweight Charts |
| Backend | NestJS, Prisma, BullMQ |
| Database | PostgreSQL (Railway), Redis (Railway) |
| Real-time | WebSocket with Redis Pub/Sub |
| Exchanges | ccxt library |
| Deployment | Railway, Docker |
| CI/CD | GitHub Actions |

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start local services
docker compose -f docker-compose.dev.yml up -d

# Copy env file
cp env.example .env
# Edit .env with your values

# Run database migrations
cd apps/api && npx prisma migrate dev

# Start development servers
pnpm dev
```

### Production (Railway)

1. Fork this repository
2. Create a Railway project
3. Add PostgreSQL and Redis services
4. Deploy from GitHub repo
5. Set environment variables from `env.example`
6. Access your app at the Railway-provided URL

## Environment Variables

See `env.example` for all required variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — Secret for JWT tokens
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (optional)

## API Documentation

Once running, visit `/docs` for Swagger API documentation.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend (Next.js)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Chart    │ │ Screener │ │ Heatmap  │    │
│  │ Grid     │ │ Panel    │ │ View     │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │            │            │           │
│  ┌────┴────────────┴────────────┴─────┐     │
│  │       Zustand + TanStack Query     │     │
│  │       WebSocket Client             │     │
│  └────────────────┬───────────────────┘     │
└───────────────────┼─────────────────────────┘
                    │
┌───────────────────┼─────────────────────────┐
│              Backend (NestJS)                │
│  ┌────────────────┴───────────────────┐     │
│  │       REST API + WebSocket GW      │     │
│  └────┬──────────┬──────────┬────────┘     │
│       │          │          │              │
│  ┌────┴───┐ ┌───┴────┐ ┌──┴───────┐      │
│  │Exchange│ │Pattern │ │ Alerts   │      │
│  │Service │ │Engine  │ │ Engine   │      │
│  └────┬───┘ └───┬────┘ └──┬───────┘      │
│       │          │          │              │
│  ┌────┴──────────┴──────────┴──────┐       │
│  │    PostgreSQL  │  Redis          │       │
│  └────────────────┴────────────────┘       │
└─────────────────────────────────────────────┘
```

## License

Private — All rights reserved.
