# Transcription System Refactor

Date: 2026-03-30

## Summary

Major refactoring of AudioScribe's transcription pipeline and infrastructure. Replace nodejs-whisper with faster-whisper (Python), eliminate Redis/BullMQ/QueueDash in favor of SQLite-backed job processing, introduce chunked audio for resumable transcription, overhaul the Dockerfile with multi-stage builds, and improve the book detail page progress UI.

## Goals

1. **faster-whisper** — switch from nodejs-whisper (whisper.cpp) to SYSTRAN/faster-whisper for better performance and Python ecosystem integration
2. **Resumable transcription** — split audio into configurable chunks so transcription can stop and resume without losing progress
3. **Simplify infrastructure** — remove Redis, BullMQ, QueueDash, and the Node.js worker process; replace with a SQLite job table and a single Python worker
4. **Dockerfile overhaul** — multi-stage build, build at build-time not runtime, dramatically smaller image
5. **Better progress UI** — chunk-level progress visibility on the book detail page
6. **Configurable settings** — chunk duration, whisper model, compute type exposed in UI

## What Gets Removed

- `nodejs-whisper` npm dependency
- Redis server (from Dockerfile and entrypoint)
- BullMQ + all queue definitions (`src/server/jobs/queues/`)
- All Node.js workers (`src/server/jobs/workers/`)
- QueueDash UI and API route (`src/app/(authenticated)/(headless)/jobs/`, `src/app/api/queuedash/`)
- `src/server/redis.ts`
- `src/server/jobs/index.ts` (worker entry point)
- `nodemon.workers.json`
- Supervisor config for worker management
- whisper.cpp build steps from Dockerfile (cmake, build-essential, CFLAGS, GLIBC hack)
- `scripts/transcribe.js`

## What Gets Added

- `faster-whisper` Python pip dependency
- `scripts/worker.py` — single Python worker process
- `scripts/lib/` — Python modules for each pipeline stage
- New Prisma models: `Job`, `AudioChunk`, `Settings`
- Updated book detail progress UI with chunk-level visibility
- Settings page/section for transcription configuration
- Multi-stage Dockerfile

---

## Architecture

### Job Processing (replaces Redis/BullMQ)

A `Job` Prisma model in the existing SQLite database replaces all queue infrastructure.

**Job table schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| bookId | String | FK to Book |
| type | Enum | `download`, `process_audio`, `chunk`, `transcribe`, `vectorize` |
| status | Enum | `pending`, `running`, `completed`, `failed` |
| progress | Float | 0-100 |
| error | String? | Error message if failed |
| metadata | String? | JSON blob for stage-specific data |
| chunkIndex | Int? | Which chunk (for transcribe jobs) |
| totalChunks | Int? | Total chunks (for transcribe jobs) |
| sequenceOrder | Int | Execution order within a book (0=download, 1=process, 2=chunk, 3=transcribe, 4=vectorize) |
| attempts | Int | Retry count, default 0 |
| maxAttempts | Int | Max retries, default 2 |
| createdAt | DateTime | |
| startedAt | DateTime? | |
| completedAt | DateTime? | |

**How it works:**

1. Next.js API receives setup request, inserts job rows into SQLite
2. Python worker polls: `SELECT * FROM Job WHERE status = 'pending' ORDER BY createdAt LIMIT 1` every 2 seconds
3. Worker sets status to `running`, does the work, updates `progress` periodically, sets `completed` or `failed`
4. Next.js API serves progress to the UI by reading Job rows (same as current BookSetupProgress, but unified)
5. On failure with attempts < maxAttempts, worker resets status to `pending` and increments attempts

**Flow orchestration:** When a book setup is triggered, the API creates jobs in dependency order. The worker processes them sequentially per book. A `transcribe` job for chunk N only becomes `pending` after chunk N-1 completes (or all chunk jobs are created as `pending` and the worker picks them up by `chunkIndex` order).

Simpler approach for ordering: create all jobs upfront with a `sequenceOrder` integer field. Worker query becomes: `WHERE status = 'pending' AND bookId = ? ORDER BY sequenceOrder, chunkIndex`.

### Python Worker (`scripts/worker.py`)

Single long-running Python process that replaces all Node.js workers.

**Modules in `scripts/lib/`:**

| Module | Replaces | Purpose |
|--------|----------|---------|
| `download.py` | `download.worker.ts` | Fetch audio files from Audiobookshelf via HTTP |
| `audio.py` | `process-audio.worker.ts` | FFmpeg audio processing (same filter chain) |
| `chunk.py` | (new) | Split processed audio into N-minute segments |
| `transcribe.py` | `transcribe.worker.ts` + `scripts/transcribe.js` | faster-whisper transcription |
| `vectorize.py` | `vectorize.worker.ts` | ChromaDB Python client for embeddings |
| `db.py` | (new) | SQLite helpers for reading/writing jobs and transcript segments |

**Worker loop (simplified):**

```python
while True:
    job = db.get_next_pending_job()
    if job:
        try:
            handler = handlers[job.type]
            handler(job)
            db.complete_job(job.id)
        except Exception as e:
            db.fail_job(job.id, str(e))
    else:
        time.sleep(2)
```

**Database access:** Python uses `sqlite3` stdlib to read/write the same SQLite database as Prisma/Next.js. This is safe for the concurrency level of this app (one writer at a time for jobs, Next.js mostly reads). WAL mode should be enabled for concurrent reads during writes.

### Resumable Chunked Transcription

**Chunking stage:**

1. After audio processing produces a single WAV file, the `chunk` job runs
2. FFmpeg splits the audio: `ffmpeg -i input.wav -f segment -segment_time {chunk_duration} -c copy chunks/book-id/chunk_%04d.wav`
3. Chunk files are stored in `{DATA_DIR}/chunks/{bookId}/`
4. Job metadata records total chunk count
5. Individual `transcribe` jobs are created for each chunk (chunkIndex 0..N-1)

**Transcription per chunk:**

1. Worker loads chunk WAV file
2. faster-whisper processes it, producing segments with timestamps
3. Timestamps are offset: `segment.start + (chunkIndex * chunkDuration)` to get book-absolute times
4. `TranscriptSegment` rows are written to DB immediately
5. Job marked completed

**Resume behavior:**

- If the process dies mid-transcription, the current chunk's job stays `running`
- On worker restart, any `running` jobs older than 5 minutes are reset to `pending` (stale job recovery)
- Completed chunk jobs are skipped; worker picks up next pending chunk
- Already-saved TranscriptSegment rows for the failed chunk are deleted before re-processing (idempotency)

**Partial transcription availability:**

- TranscriptSegment rows are committed per-chunk as they complete
- The UI can display whatever segments exist, even if transcription is ongoing
- The book's `transcribed` flag is only set to `true` when all chunks complete

### Audio Chunk Model

A lightweight model to track chunk files:

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| bookId | String | FK to Book |
| chunkIndex | Int | 0-based index |
| filePath | String | Path to chunk WAV file |
| startTime | Float | Start time in seconds (book-absolute) |
| endTime | Float | End time in seconds |
| duration | Float | Chunk duration in seconds |

### Settings

A key-value `Settings` table:

| Field | Type | Description |
|-------|------|-------------|
| key | String | Primary key |
| value | String | JSON-encoded value |
| updatedAt | DateTime | |

**Default settings:**

| Key | Default | Description |
|-----|---------|-------------|
| `transcription.chunkDuration` | `300` | Chunk duration in seconds (5 min) |
| `transcription.whisperModel` | `large-v3` | faster-whisper model name |
| `transcription.computeType` | `int8` | faster-whisper compute type (int8/float16/float32) |
| `transcription.concurrentChunks` | `1` | Parallel chunk transcription (future use) |

Exposed via a settings page in the UI and a Next.js API route (`GET/PUT /api/settings`).

---

## Dockerfile — Multi-Stage Build

### Stage 1: `deps`

```dockerfile
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
```

### Stage 2: `build`

```dockerfile
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build
RUN pnpm prune --prod
```

### Stage 3: `python`

```dockerfile
FROM python:3.12-slim AS python
RUN pip install --no-cache-dir \
    faster-whisper \
    chromadb \
    piper-tts==1.2.0
```

### Stage 4: `runtime`

```dockerfile
FROM node:24-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    sqlite3 \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy built Next.js app + prod node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public

# Copy Python environment
COPY --from=python /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=python /usr/local/bin /usr/local/bin

# Copy source files needed at runtime
COPY prisma ./prisma
COPY scripts ./scripts
COPY entrypoint.sh ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="127.0.0.1"
ENV CHROMA_PORT="8000"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

EXPOSE 3000
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
```

**Key differences from current:**
- No build-essential, cmake, git, make, wget, pkg-config, dev headers
- No GLIBC hack
- No Redis server
- No whisper.cpp compilation
- No supervisor
- `pnpm build` happens in stage 2, not at runtime
- Image size reduction: likely 60-70% smaller

### Entrypoint (simplified)

```bash
#!/bin/sh
set -e
mkdir -p /app/data/sqlite /app/data/chunks

# Database setup
pnpm db:generate
pnpm db:push

# Start Python worker in background
python3 /app/scripts/worker.py &
WORKER_PID=$!

# Start Next.js
trap "kill $WORKER_PID 2>/dev/null; exit" SIGTERM SIGINT
node /app/.next/standalone/server.js &
NEXT_PID=$!

wait $NEXT_PID $WORKER_PID
```

No supervisor needed. Shell trap handles signal forwarding.

**Note:** ChromaDB still runs as a separate process. Add it to the entrypoint alongside the Python worker:

```bash
# Start ChromaDB
chroma run --host 127.0.0.1 --port 8000 --path /app/data/chroma &
CHROMA_PID=$!
```

Update the trap to also kill `$CHROMA_PID`.

---

## Book Detail Page — Progress UI

### Current state
- 4-stage linear view (Download, ProcessAudio, Transcribe, Vectorize)
- Single progress bar for running stage
- Polling every 1 second

### New design

**Overall layout:**

```
[=========================================-----] 78% — Transcribing (chunk 37/47)
                                                  ~4 min remaining

  Download          [====] Done
  Process Audio     [====] Done
  Chunk Audio       [====] Done (47 chunks)
  Transcribe        [====-] 37/47 chunks
  Vectorize         [    ] Pending

  [v] Show transcript so far
  ────────────────────────────
  "...and the narrator continued with the story
   of the ancient kingdom, describing the vast..."
```

**Key changes:**
- Top-level progress bar reflects overall completion (weighted: download 5%, process 5%, chunk 5%, transcribe 80%, vectorize 5%)
- Chunk count visible during transcription stage
- ETA based on average chunk processing time (more accurate with uniform chunks)
- Expandable live transcript preview showing latest completed chunk text
- Polling interval: 2 seconds (matching worker poll, no need for 1s)

**API changes:**
- `GET /api/book/[id]/setup/progress` — returns Job rows grouped by type, with chunk-level detail for transcribe jobs
- No structural change to the endpoint, just richer data from the new Job model

---

## Migration Path

The existing `BookSetupProgress` model is replaced by the `Job` model. Books that were already transcribed keep their `TranscriptSegment` data and boolean flags — no data loss. The migration:

1. Add new models (`Job`, `AudioChunk`, `Settings`) via Prisma migration
2. Remove `BookSetupProgress` model
3. Update Book model: remove `downloaded`, `audioProcessed`, `transcribed`, `vectorized` booleans — derive these from Job status instead (or keep them as cached flags updated when all jobs of a type complete)

Recommendation: keep the boolean flags on Book as cached status for fast queries, updated by the Python worker when a stage completes. Simpler than joining Job table every time.

---

## Out of Scope

- Notification system (keep existing or defer)
- Chapter summary generation (keep existing, runs from Next.js)
- Authentication/session changes
- AI chat features
- Audiobookshelf API integration changes (download logic moves to Python but same API)
