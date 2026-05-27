#!/bin/bash

export NODE_ENV=production
PROXY_PORT="${PORT:-8080}"

echo ">>> Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy 2>&1 || npx prisma db push --skip-generate 2>&1 || echo ">>> Migration skipped"

echo ">>> Starting Next.js on port 3000..."
cd /app/apps/web
PORT=3000 node server.js &

echo ">>> Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js &

echo ">>> Starting proxy on port $PROXY_PORT..."
cd /app
PORT=$PROXY_PORT node scripts/proxy.js &

wait
