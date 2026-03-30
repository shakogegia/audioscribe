#!/bin/bash
set -e

mkdir -p /app/data/sqlite /app/data/chunks

# Database setup
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start Python worker in background (-u for unbuffered output)
python3 -u -m scripts.worker &
WORKER_PID=$!

# Trap signals for graceful shutdown
trap "kill $WORKER_PID 2>/dev/null; exit 0" SIGTERM SIGINT

# Start Next.js
pnpm start &
NEXT_PID=$!

wait $NEXT_PID $WORKER_PID
