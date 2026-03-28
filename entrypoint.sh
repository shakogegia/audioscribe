#!/bin/sh

mkdir -p $DATA_DIR /app/.next /app/data/redis

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
npx prisma generate
npx prisma db seed
npx prisma db push --accept-data-loss

# Build the application
echo "Building Next.js application..."
pnpm build

echo "Starting supervisor..."
supervisord -c /app/supervisord.conf
