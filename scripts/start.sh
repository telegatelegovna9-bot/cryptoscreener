#!/bin/bash

export NODE_ENV=production
PROXY_PORT="${PORT:-8080}"

echo ">>> Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy 2>&1 || {
  echo ">>> Database has existing tables, baselining..."
  npx prisma migrate resolve --applied 0_init 2>&1
  npx prisma migrate deploy 2>&1 || echo ">>> Migration skipped (non-fatal)"
}

echo ">>> Starting Next.js on port 3000..."
cd /app/apps/web
PORT=3000 node server.js 2>&1 &
NEXT_PID=$!

echo ">>> Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js 2>&1 &
API_PID=$!

echo ">>> Starting proxy on port $PROXY_PORT..."
cd /app
PORT=$PROXY_PORT node scripts/proxy.js 2>&1 &
PROXY_PID=$!

wait
