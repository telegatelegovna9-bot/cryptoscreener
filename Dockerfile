# ============================================
# CRYPTO SCREENER - PRODUCTION DOCKERFILE
# Multi-stage build for Railway deployment
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:22-slim AS deps
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1

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

# Build shared package first
RUN echo ">>> Building shared package..." && cd packages/shared && pnpm build 2>&1

# Generate Prisma client
RUN echo ">>> Generating Prisma client..." && cd apps/api && pnpm exec prisma generate 2>&1

# Build web app
RUN echo ">>> Building web app..." && cd apps/web && pnpm build 2>&1

# Build API
RUN echo ">>> Building API..." && cd apps/api && pnpm build 2>&1

# Fix standalone: copy real node_modules into standalone output
RUN cp -r /app/apps/web/node_modules /app/apps/web/.next/standalone/apps/web/node_modules 2>/dev/null || true
RUN mkdir -p /app/apps/web/.next/standalone/packages/shared && cp -r /app/packages/shared/dist /app/apps/web/.next/standalone/packages/shared/dist 2>/dev/null || true
RUN cp /app/packages/shared/package.json /app/apps/web/.next/standalone/packages/shared/package.json 2>/dev/null || true

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
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

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

HEALTHCHECK --interval=30s --timeout=10s --tries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["./scripts/start.sh"]
