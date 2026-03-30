#!/bin/sh
set -e

mkdir -p /app/data/sqlite /app/data/chunks /app/data/chromadb

# Database setup
pnpm db:generate
pnpm db:push

# Start ChromaDB in background
chroma run --host 127.0.0.1 --port 8000 --path /app/data/chromadb &
CHROMA_PID=$!

# Start Python worker in background
python3 -m scripts.worker &
WORKER_PID=$!

# Trap signals for graceful shutdown
trap "kill $CHROMA_PID $WORKER_PID 2>/dev/null; exit" SIGTERM SIGINT

# Start Next.js (foreground)
pnpm start &
NEXT_PID=$!

wait $NEXT_PID $WORKER_PID $CHROMA_PID
