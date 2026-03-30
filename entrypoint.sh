#!/bin/sh
set -e

mkdir -p /app/data/sqlite /app/data/chunks

# Database setup
pnpm db:generate
pnpm db:push

# Start Python worker in background
python3 -m scripts.worker &
WORKER_PID=$!

# Trap signals for graceful shutdown
trap "kill $WORKER_PID 2>/dev/null; exit" SIGTERM SIGINT

# Start Next.js (foreground)
pnpm start &
NEXT_PID=$!

wait $NEXT_PID $WORKER_PID
