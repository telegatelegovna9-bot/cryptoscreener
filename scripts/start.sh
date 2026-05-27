#!/bin/bash
set -e

PORT="${PORT:-4000}"

echo "Starting Next.js on port 3000..."
cd /app/apps/web
PORT=3000 node server.js &
NEXT_PID=$!

echo "Starting NestJS API on port 4001..."
cd /app
node apps/api/dist/main.js &
API_PID=$!

echo "Starting proxy on port $PORT..."
node /app/scripts/proxy.js &
PROXY_PID=$!

trap "kill $NEXT_PID $API_PID $PROXY_PID 2>/dev/null" SIGTERM SIGINT

wait -n $NEXT_PID $API_PID $PROXY_PID
