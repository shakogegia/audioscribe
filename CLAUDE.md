# AudioScribe

A companion app for Audiobookshelf that uses AI for transcription, chat, and audiobook enhancement.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Database**: SQLite via Prisma (`@prisma/adapter-better-sqlite3`)
- **Job Queue**: Python worker polling SQLite jobs table
- **AI**: Vercel AI SDK with Anthropic, OpenAI, Google, xAI, Ollama
- **Vector DB**: ChromaDB
- **ASR**: faster-whisper (Python)
- **TTS**: Piper TTS

## Commands

```sh
make dev          # Run locally (Next.js + Python worker + ChromaDB)
make build        # Docker build
make run          # Docker build + run
make stop         # Stop container
make logs         # Tail container logs
make push         # Multi-arch push to Docker Hub

pnpm dev          # Next.js dev server only
pnpm dev:all      # Next.js + Python worker + ChromaDB (concurrently)
python3 -m scripts.worker  # Run Python worker standalone

pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio
pnpm db:migrate   # Run migrations
```

## Project Structure

```
src/
  app/            # Next.js App Router (pages, API routes, server actions)
  components/     # React components (ui/, ai-elements/, player/, navigation/)
  ai/             # AI provider abstractions
  lib/            # Utilities (prisma, session, config, audiobookshelf API)
  stores/         # Zustand state
  prompts/        # AI system prompts
  hooks/          # React hooks
.conductor/       # Conductor workspace scripts (setup, run, archive)
scripts/          # Python worker (worker.py, lib/)
  lib/            # Worker modules (audio.py, chunk.py, transcribe.py, vectorize.py, download.py, db.py, config.py)
prisma/           # Schema + migrations
```

## Architecture

Single Next.js app with colocated frontend and backend. A Python worker runs as a separate process, polling the SQLite jobs table for work and processing audiobook transcription, chunking, and vectorization. In production Docker, a process manager runs three processes: Next.js server, Python worker, and ChromaDB.

## Conventions

- Package manager: **pnpm** (not npm/yarn)
- Docker: single `Dockerfile` at root, no docker-compose. Use `Makefile` targets.
- Conductor workspaces: scripts in `.conductor/` (env.sh, setup.sh, run.sh, archive.sh)
