#!/bin/bash

# Preserve Railway's PORT for the proxy, fix internal ports
PROXY_PORT="${PORT:-4000}"
export NODE_ENV=production

echo "=== DEBUG: NODE_ENV=$NODE_ENV, PROXY_PORT=$PROXY_PORT ==="
echo "=== DEBUG: Contents of /app ==="
ls -la /app/ 2>&1
echo "=== DEBUG: Looking for server.js ==="
find /app -name "server.js" -maxdepth 5 2>/dev/null
echo "=== DEBUG: Looking for main.js ==="
find /app -name "main.js" -maxdepth 5 2>/dev/null

# Run Prisma migrations
echo "Running Prisma migrations..."
cd /app/apps/api
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma/client" ]; then
  echo "Prisma client found, running migrate deploy..."
  npx prisma migrate deploy 2>&1 || {
    echo "Migrate deploy failed, trying db push..."
    npx prisma db push --skip-generate 2>&1 || echo "DB push also failed (non-fatal)"
  }
else
  echo "Prisma client not found, skipping migrations"
fi

# Find Next.js server.js
NEXTJS_DIR=""
for dir in /app/app/apps/web /app/apps/web /app/server.js; do
  if [ -f "$dir/server.js" ]; then
    NEXTJS_DIR="$dir"
    break
  fi
done

if [ -z "$NEXTJS_DIR" ]; then
  echo "ERROR: Cannot find Next.js server.js anywhere!"
else
  echo "Starting Next.js on port 3000 from $NEXTJS_DIR..."
  cd "$NEXTJS_DIR"
  PORT=3000 node server.js &
  NEXT_PID=$!
fi

echo "Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js &
API_PID=$!

echo "Starting proxy on port $PROXY_PORT..."
PORT=$PROXY_PORT node /app/scripts/proxy.js &
PROXY_PID=$!

trap "kill $NEXT_PID $API_PID $PROXY_PID 2>/dev/null" SIGTERM SIGINT

wait -n $NEXT_PID $API_PID $PROXY_PID
