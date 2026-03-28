#!/bin/sh
set -e

mkdir -p $DATA_DIR /app/data/sqlite /app/data/redis /app/.next

# Start Redis with persistence
echo "Starting Redis server..."
redis-cli shutdown 2>/dev/null || true
redis-server --daemonize yes \
    --dir /app/data/redis \
    --appendonly yes \
    --appendfilename "appendonly.aof"

# Setup environment
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Build the application
echo "Building Next.js application..."
pnpm build

echo "Starting supervisor..."
supervisord -c /app/supervisord.conf
