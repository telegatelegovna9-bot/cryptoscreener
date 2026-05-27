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

# Find Next.js server.js — standalone preserves project structure
NEXTJS_DIR=""
for dir in /app/app/apps/web /app/apps/web; do
  if [ -f "$dir/server.js" ]; then
    NEXTJS_DIR="$dir"
    break
  fi
done

if [ -n "$NEXTJS_DIR" ]; then
  echo ">>> Starting Next.js on port 3000 from $NEXTJS_DIR..."
  cd "$NEXTJS_DIR"
  # Run in foreground briefly to catch startup errors, then background
  PORT=3000 node server.js 2>&1 &
  NEXT_PID=$!
  # Give it a moment to start and check if it crashes
  sleep 2
  if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo ">>> ERROR: Next.js crashed on startup!"
  else
    echo ">>> Next.js running (PID $NEXT_PID)"
  fi
else
  echo ">>> ERROR: Next.js server.js not found in any directory!"
  echo ">>> Contents of /app:"
  ls -la /app/
  echo ">>> Contents of /app/apps/web:"
  ls -la /app/apps/web/ 2>/dev/null || echo "(not found)"
fi

echo ">>> Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js 2>&1 &
API_PID=$!

echo ">>> Starting proxy on port $PROXY_PORT..."
cd /app
PORT=$PROXY_PORT node scripts/proxy.js 2>&1 &
PROXY_PID=$!

# Wait for any process to exit
wait -n $NEXT_PID $API_PID $PROXY_PID

# If we get here, one process died — check which
echo ">>> A process exited. Checking..."
for pid in $NEXT_PID $API_PID $PROXY_PID; do
  if ! kill -0 $pid 2>/dev/null; then
    echo ">>> Process $pid is dead"
  fi
done

# Keep container alive
wait
