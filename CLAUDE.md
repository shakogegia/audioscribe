# AudioScribe

A companion app for Audiobookshelf that uses AI for transcription, chat, and audiobook enhancement.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Database**: SQLite via Prisma (`@prisma/adapter-better-sqlite3`)
- **Job Queue**: BullMQ + Redis
- **AI**: Vercel AI SDK with Anthropic, OpenAI, Google, xAI, Ollama
- **Vector DB**: ChromaDB
- **ASR**: Whisper (nodejs-whisper)
- **TTS**: Piper TTS

## Commands

```sh
make dev          # Run locally (Next.js + workers + ChromaDB)
make build        # Docker build
make run          # Docker build + run
make stop         # Stop container
make logs         # Tail container logs
make push         # Multi-arch push to Docker Hub

pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio
pnpm db:migrate   # Run migrations
```

## Project Structure

```
src/
  app/            # Next.js App Router (pages, API routes, server actions)
  server/         # Express routes, Redis, BullMQ jobs (queues + workers)
  components/     # React components (ui/, ai-elements/, player/, navigation/)
  ai/             # AI provider abstractions
  lib/            # Utilities (prisma, session, config, audiobookshelf API)
  stores/         # Zustand state
  prompts/        # AI system prompts
  hooks/          # React hooks
.conductor/       # Conductor workspace scripts (setup, run, archive)
scripts/          # CLI tools (transcribe.js, piper_tts.py)
prisma/           # Schema + migrations
```

## Architecture

Single Next.js app with colocated frontend and backend. Workers run as separate processes via BullMQ/Redis but share the same codebase. In production Docker, supervisor manages three processes: Next.js server, workers, and ChromaDB.

## Conventions

- Package manager: **pnpm** (not npm/yarn)
- Docker: single `Dockerfile` at root, no docker-compose. Use `Makefile` targets.
- Conductor workspaces: scripts in `.conductor/` (env.sh, setup.sh, run.sh, archive.sh)
