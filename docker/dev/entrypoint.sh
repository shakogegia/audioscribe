#!/bin/sh

# Create necessary directories
mkdir -p $DATA_DIR /app/.next /app/data/redis

# Stop any existing Redis instance and start with persistence
echo "Starting Redis server..."
redis-cli shutdown 2>/dev/null || true
redis-server --daemonize yes \
    --dir /app/data/redis \
    --appendonly yes \
    --appendfilename "appendonly.aof"

# Check if .env file exists, otherwise copy from .env.example
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Setup database
npx prisma generate
npx prisma db seed
npx prisma db push --accept-data-loss

echo "Starting supervisor..."
supervisord -c /etc/supervisor/supervisord.conf