# ============================================
# CRYPTO SCREENER - PRODUCTION DOCKERFILE
# Multi-stage build for Railway deployment
#
# Architecture:
#   NestJS (port $PORT) ← Railway's public port
#     ├── /api/* → NestJS API handlers
#     ├── /docs → Swagger UI
#     ├── /health → Health check
#     └── /* → proxy → Next.js (port 3000, internal)
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:22-slim AS deps
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# --- Stage 2: Build everything ---
FROM node:22-slim AS builder
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client first
RUN cd apps/api && pnpm exec prisma generate

# Build all packages (API + Web + Shared)
RUN pnpm turbo build

# --- Stage 3: Production image ---
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends wget tini bash openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# --- Copy NestJS API ---
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# --- Copy Next.js standalone ---
# Standalone preserves project path: standalone/app/apps/web/server.js
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./app/apps/web/.next/static
COPY --from=builder /app/apps/web/public ./app/apps/web/public

# --- Copy shared package ---
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# --- Copy root dependencies ---
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# --- Scripts ---
COPY scripts/start.sh ./scripts/start.sh
COPY scripts/proxy.js ./scripts/proxy.js
RUN chmod +x ./scripts/start.sh

EXPOSE 3000 4000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["./scripts/start.sh"]
