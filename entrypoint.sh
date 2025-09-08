#!/bin/sh

# Create data directory (env: DATA_DIR) if it doesn't exist
mkdir -p $DATA_DIR

# Setup prisma client
npx prisma generate
npx prisma db push
npx prisma migrate dev

# Build the application
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