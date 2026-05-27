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
  PORT=3000 node server.js &
else
  echo ">>> ERROR: Next.js server.js not found!"
fi

echo ">>> Starting NestJS API on port 4001..."
cd /app
PORT=4001 node apps/api/dist/main.js &

echo ">>> Starting proxy on port $PROXY_PORT..."
cd /app
PORT=$PROXY_PORT node scripts/proxy.js &

wait
