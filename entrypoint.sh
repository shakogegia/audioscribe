#!/bin/sh

# Create necessary directories
mkdir -p $DATA_DIR /app/.next

# Setup database
npx prisma generate
npx prisma db push --accept-data-loss

# Build the application
echo "Building Next.js application..."
npm run build

echo "Starting ChromaDB server..."
pm2 start npm --name "chroma" -- run chroma

echo "Starting workers..."
pm2 start npm --name "workers" -- run workers

echo "Starting audioscribe application..."
pm2 start npm --name "audioscribe" -- run start

# Show status and keep container running
pm2 status
pm2 logs --lines 50
tail -f /dev/null