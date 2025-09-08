#!/bin/sh

# Ensure proper permissions for build directories
# This is especially important when running with volume mounts in Portainer
mkdir -p $DATA_DIR /app/.next
chmod -R 755 /app/.next 2>/dev/null || true
chmod -R 755 $DATA_DIR 2>/dev/null || true

# Setup prisma client
npx prisma generate
npx prisma db push
npx prisma migrate dev

# Build the application
echo "Building Next.js application..."
npm run build

# Start the chroma server
echo "Starting ChromaDB server..."
pm2 start npm --name "chroma" -- run chroma

# Wait a moment for ChromaDB to start
sleep 5

# Start the jobs
echo "Starting job processor..."
pm2 start npm --name "jobs" -- run jobs

# Start the application
echo "Starting audioscribe application..."
pm2 start npm --name "audioscribe" -- run next:start

# Show PM2 status
pm2 status

# Keep the container running
tail -f /dev/null