#!/bin/bash
set -e

# Preserve Railway's PORT for the proxy, fix internal ports
PROXY_PORT="${PORT:-4000}"
export NODE_ENV=production

# Run Prisma migrations
echo "Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy 2>&1 || echo "Migration warning (non-fatal)"

# Next.js standalone preserves project structure: standalone/app/apps/web/server.js
NEXTJS_DIR="/app/app/apps/web"
if [ ! -f "$NEXTJS_DIR/server.js" ]; then
  # Fallback: maybe standalone was copied flat
  NEXTJS_DIR="/app/apps/web"
fi
echo "Starting Next.js on port 3000 from $NEXTJS_DIR..."
cd "$NEXTJS_DIR"
PORT=3000 node server.js &
NEXT_PID=$!

echo "Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js &
API_PID=$!

echo "Starting proxy on port $PROXY_PORT..."
PORT=$PROXY_PORT node /app/scripts/proxy.js &
PROXY_PID=$!

trap "kill $NEXT_PID $API_PID $PROXY_PID 2>/dev/null" SIGTERM SIGINT

wait -n $NEXT_PID $API_PID $PROXY_PID
