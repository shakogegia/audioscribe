#!/bin/sh

# Create necessary directories
mkdir -p $DATA_DIR /app/.next

# Setup database
npx prisma generate
npx prisma db push

# Build the application
echo "Building Next.js application..."
npm run build

# Start services with PM2
echo "Starting ChromaDB server..."
pm2 start npm --name "chroma" -- run chroma

echo "Starting audioscribe application..."
pm2 start npm --name "audioscribe" -- run next:start

# Show status and keep container running
pm2 status
pm2 logs --lines 50
tail -f /dev/null