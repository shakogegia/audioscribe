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

# # Build the application
# echo "Building Next.js application..."
# npm run build

# echo "Starting ChromaDB server..."
# pm2 start npm --name "chroma" -- run chroma

# echo "Starting workers..."
# pm2 start npm --name "workers" -- run workers

# echo "Starting audioscribe application..."
# pm2 start npm --name "audioscribe" -- run start

# # Show status and keep container running
# pm2 status
# pm2 logs --lines 50
# tail -f /dev/null

echo "Starting supervisor..."
supervisord -c /etc/supervisor/supervisord.conf