# Transcription System Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace nodejs-whisper with faster-whisper, remove Redis/BullMQ/QueueDash, add chunked resumable transcription via a SQLite job table + Python worker, overhaul the Dockerfile, and improve the progress UI.

**Architecture:** Next.js handles the frontend and API. A Python worker process polls a SQLite `Job` table for pending work and executes pipeline stages (download, process audio, chunk, transcribe, vectorize). Transcription splits audio into configurable fixed-duration chunks for resumability. Progress is tracked in SQLite and served to the UI via existing API patterns.

**Tech Stack:** Next.js 16, Prisma (SQLite), Python 3.12, faster-whisper, FFmpeg, ChromaDB (Python client), shadcn/ui

---

## File Structure

### New files

```
scripts/
  worker.py              — Main worker entry point (poll loop, signal handling)
  lib/
    __init__.py
    db.py                — SQLite helpers (job CRUD, transcript segments, settings)
    download.py          — Download audio from Audiobookshelf
    audio.py             — FFmpeg stitching + preprocessing
    chunk.py             — Split processed audio into fixed-duration chunks
    transcribe.py        — faster-whisper transcription per chunk
    vectorize.py         — ChromaDB vectorization
    config.py            — Load env vars, settings from DB
  requirements.txt       — Python dependencies
```

### Modified files

```
prisma/schema.prisma                              — Add Job, AudioChunk, Setting models; add Chunk stage enum
src/app/api/book/[id]/setup/route.ts              — Replace setupBookFlow with direct Job row insertion
src/app/api/book/[id]/setup/progress/route.ts     — Query Job table instead of BookSetupProgress
src/app/(authenticated)/(navigation)/(main)/book/[id]/components/processing-info.tsx — New chunk-aware progress UI
package.json                                       — Remove bullmq, ioredis, nodejs-whisper, audioconcat, fluent-ffmpeg, queuedash
Dockerfile                                         — Multi-stage build
entrypoint.sh                                      — Simplified (no Redis, no pnpm build)
```

### Deleted files

```
src/server/jobs/                    — Entire directory (queues/, workers/, index.ts)
src/server/redis.ts
scripts/transcribe.js
nodemon.workers.json
supervisord.conf
src/app/(authenticated)/(headless)/jobs/           — QueueDash UI
src/app/api/queuedash/                             — QueueDash API
```

---

## Task 1: Prisma Schema — Add Job, AudioChunk, Setting models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new enums and models to schema**

Add after the existing `BookSetupStatus` enum at line 84:

```prisma
enum JobType {
  Download
  ProcessAudio
  Chunk
  Transcribe
  Vectorize
}

enum JobStatus {
  Pending
  Running
  Completed
  Failed
}

model Job {
  id            String    @id @default(cuid())
  bookId        String
  type          JobType
  status        JobStatus @default(Pending)
  progress      Float     @default(0)
  error         String?
  metadata      String?
  chunkIndex    Int?
  totalChunks   Int?
  sequenceOrder Int       @default(0)
  attempts      Int       @default(0)
  maxAttempts   Int       @default(2)
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  updatedAt     DateTime  @updatedAt

  book Book @relation(fields: [bookId], references: [id])

  @@index([bookId])
  @@index([status, sequenceOrder])
}

model AudioChunk {
  id         String @id @default(cuid())
  bookId     String
  chunkIndex Int
  filePath   String
  startTime  Float
  endTime    Float
  duration   Float

  book Book @relation(fields: [bookId], references: [id])

  @@unique([bookId, chunkIndex])
  @@index([bookId])
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Add relations to Book model**

In the Book model (line 13), add the new relations after the existing ones:

```prisma
  // existing relations
  transcriptSegment TranscriptSegment[]
  bookSetupProgress BookSetupProgress[]
  chapterSummaries  ChapterSummary[]

  // new relations
  jobs        Job[]
  audioChunks AudioChunk[]
```

- [ ] **Step 3: Add Chunk to BookSetupStage enum**

Update the `BookSetupStage` enum (line 72) to include the new Chunk stage:

```prisma
enum BookSetupStage {
  Download
  ProcessAudio
  Chunk
  Transcribe
  Vectorize
}
```

- [ ] **Step 4: Run migration**

```bash
pnpm db:generate
pnpm db:push
```

Expected: Prisma client regenerates with new models. No errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Job, AudioChunk, Setting models to Prisma schema"
```

---

## Task 2: Python Worker Foundation — db.py and config.py

**Files:**
- Create: `scripts/lib/__init__.py`
- Create: `scripts/lib/config.py`
- Create: `scripts/lib/db.py`
- Create: `scripts/requirements.txt`

- [ ] **Step 1: Create requirements.txt**

```
faster-whisper>=1.1.0
chromadb>=1.0.0
piper-tts==1.2.0
requests>=2.32.0
```

- [ ] **Step 2: Create scripts/lib/__init__.py**

```python
```

Empty file to make it a package.

- [ ] **Step 3: Create scripts/lib/config.py**

```python
import os
import json
import sqlite3

DATA_DIR = os.environ.get("DATA_DIR", "./data")
DATABASE_PATH = os.environ.get("DATABASE_URL", f"file:{DATA_DIR}/sqlite/store.db").replace("file:", "")
AUDIOBOOKSHELF_URL = None
AUDIOBOOKSHELF_API_KEY = None

# Folder structure matching src/lib/folders.ts
CACHE_DIR = os.path.join(DATA_DIR, "cache")
CHUNKS_DIR = os.path.join(DATA_DIR, "chunks")

# Job type to sequence order mapping
SEQUENCE_ORDER = {
    "Download": 0,
    "ProcessAudio": 1,
    "Chunk": 2,
    "Transcribe": 3,
    "Vectorize": 4,
}

# Stage to Book flag mapping (matches setup.worker.ts STAGE_FLAG)
STAGE_FLAG = {
    "Download": "downloaded",
    "ProcessAudio": "audioProcessed",
    "Chunk": "audioProcessed",  # Chunk reuses audioProcessed since it's part of audio pipeline
    "Transcribe": "transcribed",
    "Vectorize": "vectorized",
}

# Default settings
DEFAULTS = {
    "transcription.chunkDuration": "300",
    "transcription.whisperModel": "large-v3",
    "transcription.computeType": "int8",
}


def load_audiobookshelf_config():
    """Load audiobookshelf URL and API key from config.json"""
    global AUDIOBOOKSHELF_URL, AUDIOBOOKSHELF_API_KEY
    config_path = os.path.join(DATA_DIR, "config.json")
    try:
        with open(config_path) as f:
            config = json.load(f)
            AUDIOBOOKSHELF_URL = config.get("audiobookshelf", {}).get("url")
            AUDIOBOOKSHELF_API_KEY = config.get("audiobookshelf", {}).get("apiKey")
    except (FileNotFoundError, json.JSONDecodeError):
        pass


def get_db() -> sqlite3.Connection:
    """Get a SQLite connection with WAL mode enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def book_downloads_dir(book_id: str) -> str:
    path = os.path.join(CACHE_DIR, book_id, "downloads")
    os.makedirs(path, exist_ok=True)
    return path


def book_audio_dir(book_id: str) -> str:
    path = os.path.join(CACHE_DIR, book_id, "audio")
    os.makedirs(path, exist_ok=True)
    return path


def book_chunks_dir(book_id: str) -> str:
    path = os.path.join(CHUNKS_DIR, book_id)
    os.makedirs(path, exist_ok=True)
    return path


def get_setting(key: str) -> str:
    """Get a setting value, falling back to defaults."""
    db = get_db()
    try:
        row = db.execute("SELECT value FROM Setting WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else DEFAULTS.get(key, "")
    finally:
        db.close()
```

- [ ] **Step 4: Create scripts/lib/db.py**

```python
import time
from scripts.lib.config import get_db


def get_next_pending_job():
    """Get the next pending job, ordered by sequence then chunk index."""
    db = get_db()
    try:
        row = db.execute(
            """SELECT * FROM Job
               WHERE status = 'Pending'
               ORDER BY sequenceOrder ASC, chunkIndex ASC
               LIMIT 1""",
        ).fetchone()
        return dict(row) if row else None
    finally:
        db.close()


def claim_job(job_id: str):
    """Set job status to Running with startedAt timestamp."""
    db = get_db()
    try:
        db.execute(
            "UPDATE Job SET status = 'Running', startedAt = datetime('now') WHERE id = ?",
            (job_id,),
        )
        db.commit()
    finally:
        db.close()


def update_job_progress(job_id: str, progress: float):
    """Update job progress percentage."""
    db = get_db()
    try:
        db.execute("UPDATE Job SET progress = ? WHERE id = ?", (min(progress, 100.0), job_id))
        db.commit()
    finally:
        db.close()


def complete_job(job_id: str):
    """Mark job as completed."""
    db = get_db()
    try:
        db.execute(
            "UPDATE Job SET status = 'Completed', progress = 100, completedAt = datetime('now') WHERE id = ?",
            (job_id,),
        )
        db.commit()
    finally:
        db.close()


def fail_job(job_id: str, error: str):
    """Mark job as failed. If attempts < maxAttempts, reset to Pending for retry."""
    db = get_db()
    try:
        row = db.execute("SELECT attempts, maxAttempts FROM Job WHERE id = ?", (job_id,)).fetchone()
        attempts = row["attempts"] + 1
        if attempts < row["maxAttempts"]:
            db.execute(
                "UPDATE Job SET status = 'Pending', attempts = ?, error = ?, progress = 0 WHERE id = ?",
                (attempts, error, job_id),
            )
        else:
            db.execute(
                "UPDATE Job SET status = 'Failed', attempts = ?, error = ?, completedAt = datetime('now') WHERE id = ?",
                (attempts, error, job_id),
            )
        db.commit()
    finally:
        db.close()


def recover_stale_jobs(timeout_minutes: int = 5):
    """Reset jobs stuck in Running state for longer than timeout."""
    db = get_db()
    try:
        db.execute(
            """UPDATE Job SET status = 'Pending', progress = 0
               WHERE status = 'Running'
               AND startedAt < datetime('now', ? || ' minutes')""",
            (f"-{timeout_minutes}",),
        )
        db.commit()
    finally:
        db.close()


def update_book_flag(book_id: str, flag: str, value: bool):
    """Update a boolean flag on the Book model."""
    db = get_db()
    try:
        db.execute(f"UPDATE Book SET {flag} = ?, updatedAt = datetime('now') WHERE id = ?", (value, book_id))
        db.commit()
    finally:
        db.close()


def mark_book_setup_complete(book_id: str):
    """Set book.setup = true when all stages are done."""
    db = get_db()
    try:
        db.execute("UPDATE Book SET setup = 1, updatedAt = datetime('now') WHERE id = ?", (book_id,))
        db.commit()
    finally:
        db.close()


def are_all_jobs_completed(book_id: str) -> bool:
    """Check if all jobs for a book are completed."""
    db = get_db()
    try:
        row = db.execute(
            "SELECT COUNT(*) as total FROM Job WHERE bookId = ? AND status != 'Completed'",
            (book_id,),
        ).fetchone()
        return row["total"] == 0
    finally:
        db.close()


def save_transcript_segments(book_id: str, model: str, segments: list[dict]):
    """Batch insert transcript segments."""
    db = get_db()
    try:
        db.executemany(
            """INSERT INTO TranscriptSegment (bookId, fileIno, model, text, startTime, endTime, createdAt, updatedAt)
               VALUES (?, 'ino', ?, ?, ?, ?, datetime('now'), datetime('now'))""",
            [(book_id, model, seg["text"], seg["startTime"], seg["endTime"]) for seg in segments],
        )
        db.commit()
    finally:
        db.close()


def delete_transcript_segments_for_chunk(book_id: str, start_time_ms: int, end_time_ms: int):
    """Delete transcript segments within a time range (for idempotent chunk re-processing)."""
    db = get_db()
    try:
        db.execute(
            "DELETE FROM TranscriptSegment WHERE bookId = ? AND startTime >= ? AND startTime < ?",
            (book_id, start_time_ms, end_time_ms),
        )
        db.commit()
    finally:
        db.close()


def create_transcribe_jobs(book_id: str, model: str, total_chunks: int):
    """Create individual transcribe jobs for each chunk."""
    db = get_db()
    try:
        # Generate cuid-like IDs using timestamp + counter
        import hashlib
        for i in range(total_chunks):
            job_id = hashlib.sha256(f"{book_id}-transcribe-{i}-{time.time()}".encode()).hexdigest()[:25]
            db.execute(
                """INSERT INTO Job (id, bookId, type, status, sequenceOrder, chunkIndex, totalChunks, metadata, updatedAt)
                   VALUES (?, ?, 'Transcribe', 'Pending', 3, ?, ?, ?, datetime('now'))""",
                (job_id, book_id, i, total_chunks, f'{{"model": "{model}"}}'),
            )
        db.commit()
    finally:
        db.close()


def save_audio_chunk(book_id: str, chunk_index: int, file_path: str, start_time: float, end_time: float, duration: float):
    """Save an audio chunk record."""
    import hashlib
    chunk_id = hashlib.sha256(f"{book_id}-chunk-{chunk_index}-{time.time()}".encode()).hexdigest()[:25]
    db = get_db()
    try:
        db.execute(
            """INSERT OR REPLACE INTO AudioChunk (id, bookId, chunkIndex, filePath, startTime, endTime, duration)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (chunk_id, book_id, chunk_index, file_path, start_time, end_time, duration),
        )
        db.commit()
    finally:
        db.close()


def get_audio_chunk(book_id: str, chunk_index: int):
    """Get an audio chunk by book and index."""
    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM AudioChunk WHERE bookId = ? AND chunkIndex = ?",
            (book_id, chunk_index),
        ).fetchone()
        return dict(row) if row else None
    finally:
        db.close()
```

- [ ] **Step 5: Commit**

```bash
git add scripts/requirements.txt scripts/lib/__init__.py scripts/lib/config.py scripts/lib/db.py
git commit -m "feat: add Python worker foundation — db and config modules"
```

---

## Task 3: Python Worker — download.py

**Files:**
- Create: `scripts/lib/download.py`

- [ ] **Step 1: Create download module**

Port download logic from `src/server/jobs/workers/download.worker.ts`.

```python
"""Download audio files from Audiobookshelf."""

import os
import requests
from scripts.lib import config, db


def get_book_files(book_id: str) -> list[dict]:
    """Fetch audio file list from Audiobookshelf API.
    Matches src/lib/audiobookshelf.ts:getBookFiles()
    """
    config.load_audiobookshelf_config()
    url = config.AUDIOBOOKSHELF_URL
    api_key = config.AUDIOBOOKSHELF_API_KEY

    resp = requests.get(
        f"{url}/audiobookshelf/api/items/{book_id}",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=30,
    )
    resp.raise_for_status()
    item = resp.json()

    audio_files = sorted(item["media"]["audioFiles"], key=lambda f: f["index"])
    cumulative_start = 0.0
    files = []
    for af in audio_files:
        duration = af.get("duration", 0)
        files.append({
            "ino": af["ino"],
            "index": af["index"],
            "duration": duration,
            "start": cumulative_start,
            "path": f"{af['ino']}{af['metadata']['ext']}",
            "downloadUrl": f"{url}/audiobookshelf/api/items/{book_id}/file/{af['ino']}/download?token={api_key}",
            "size": af["metadata"]["size"],
            "fileName": af["metadata"]["filename"],
        })
        cumulative_start += duration
    return files


def get_book_duration(book_id: str) -> float:
    """Get total book duration in seconds."""
    files = get_book_files(book_id)
    return sum(f["duration"] for f in files)


def run(job: dict):
    """Download all audio files for a book.
    Matches download.worker.ts lines 15-53.
    """
    book_id = job["bookId"]
    downloads_dir = config.book_downloads_dir(book_id)
    files = get_book_files(book_id)

    for index, file in enumerate(files):
        local_path = os.path.join(downloads_dir, file["path"])

        # Skip existing files (matches lines 29-36)
        if os.path.exists(local_path):
            continue

        # Download file
        resp = requests.get(file["downloadUrl"], timeout=600)
        resp.raise_for_status()
        with open(local_path, "wb") as f:
            f.write(resp.content)

        progress = round(((index + 1) / len(files)) * 100, 2)
        db.update_job_progress(job["id"], progress)

    # Update book flag
    db.update_book_flag(book_id, "downloaded", True)
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/download.py
git commit -m "feat: add Python download worker module"
```

---

## Task 4: Python Worker — audio.py (stitch + preprocess)

**Files:**
- Create: `scripts/lib/audio.py`

- [ ] **Step 1: Create audio processing module**

Port from `src/server/jobs/workers/process-audio.worker.ts`.

```python
"""Audio stitching and preprocessing via FFmpeg.
Ports process-audio.worker.ts logic.
"""

import os
import subprocess
import re
from scripts.lib import config, db
from scripts.lib.download import get_book_files


def stitch_audio_files(files: list[str], output_dir: str) -> str:
    """Concatenate multiple audio files into one.
    Replaces audioconcat library (process-audio.worker.ts lines 60-78).
    """
    output_file = os.path.join(output_dir, "stitched.wav")

    # Create concat list file for FFmpeg
    list_file = os.path.join(output_dir, "concat_list.txt")
    with open(list_file, "w") as f:
        for filepath in files:
            # Escape single quotes in path
            escaped = filepath.replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")

    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", output_file],
        check=True,
        capture_output=True,
    )

    os.remove(list_file)
    return output_file


def preprocess_audio(input_path: str, output_dir: str, job_id: str) -> str:
    """Apply audio filters for transcription quality.
    Matches process-audio.worker.ts lines 80-122.
    FFmpeg filters: 16kHz mono, highpass, lowpass, volume boost, compression.
    """
    output_path = os.path.join(output_dir, "processed.wav")

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        "-acodec", "pcm_s16le",
        "-af", "highpass=f=80,lowpass=f=8000,volume=1.5,acompressor=threshold=-20dB:ratio=3:attack=1:release=50",
        "-f", "wav",
        "-progress", "pipe:1",
        output_path,
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # Parse FFmpeg progress output
    duration_seconds = None
    for line in process.stdout:
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                out_time_us = int(line.split("=")[1])
                if duration_seconds and duration_seconds > 0:
                    progress = min((out_time_us / 1_000_000 / duration_seconds) * 100, 100)
                    db.update_job_progress(job_id, round(progress, 2))
            except (ValueError, ZeroDivisionError):
                pass

    process.wait()
    if process.returncode != 0:
        stderr = process.stderr.read()
        raise RuntimeError(f"FFmpeg preprocessing failed: {stderr}")

    # Clean up input file (matches line 111)
    try:
        os.remove(input_path)
    except OSError:
        pass

    return output_path


def run(job: dict):
    """Process audio for a book.
    Matches process-audio.worker.ts lines 12-58.
    """
    book_id = job["bookId"]
    audio_dir = config.book_audio_dir(book_id)
    processed_path = os.path.join(audio_dir, "processed.wav")

    # Skip if already processed (matches lines 24-28)
    if os.path.exists(processed_path):
        db.update_book_flag(book_id, "audioProcessed", True)
        return

    book_files = get_book_files(book_id)
    downloads_dir = config.book_downloads_dir(book_id)

    files = [os.path.join(downloads_dir, f["path"]) for f in book_files]

    # Stitch if multiple files (matches line 41)
    if len(files) > 1:
        audio_path = stitch_audio_files(files, audio_dir)
    else:
        audio_path = files[0]

    preprocess_audio(audio_path, audio_dir, job["id"])
    db.update_book_flag(book_id, "audioProcessed", True)
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/audio.py
git commit -m "feat: add Python audio processing module (stitch + preprocess)"
```

---

## Task 5: Python Worker — chunk.py

**Files:**
- Create: `scripts/lib/chunk.py`

- [ ] **Step 1: Create chunk module**

```python
"""Split processed audio into fixed-duration chunks for resumable transcription."""

import os
import subprocess
import json
from scripts.lib import config, db


def get_audio_duration(file_path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", file_path],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(result.stdout)
    return float(info["format"]["duration"])


def run(job: dict):
    """Split processed audio into chunks.
    Creates chunk files and individual transcribe jobs.
    """
    book_id = job["bookId"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model = metadata.get("model", config.get_setting("transcription.whisperModel"))

    audio_dir = config.book_audio_dir(book_id)
    processed_path = os.path.join(audio_dir, "processed.wav")
    chunks_dir = config.book_chunks_dir(book_id)

    chunk_duration = int(config.get_setting("transcription.chunkDuration"))
    total_duration = get_audio_duration(processed_path)

    # Split using FFmpeg segment muxer
    chunk_pattern = os.path.join(chunks_dir, "chunk_%04d.wav")
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", processed_path,
            "-f", "segment",
            "-segment_time", str(chunk_duration),
            "-c", "copy",
            chunk_pattern,
        ],
        check=True,
        capture_output=True,
    )

    # Enumerate chunk files and save metadata
    chunk_files = sorted(
        [f for f in os.listdir(chunks_dir) if f.startswith("chunk_") and f.endswith(".wav")]
    )
    total_chunks = len(chunk_files)

    for i, filename in enumerate(chunk_files):
        chunk_path = os.path.join(chunks_dir, filename)
        chunk_dur = get_audio_duration(chunk_path)
        start_time = i * chunk_duration
        end_time = start_time + chunk_dur

        db.save_audio_chunk(book_id, i, chunk_path, start_time, end_time, chunk_dur)

    # Create transcribe jobs for each chunk
    db.create_transcribe_jobs(book_id, model, total_chunks)

    # Update job metadata with total chunks
    conn = config.get_db()
    try:
        conn.execute(
            "UPDATE Job SET metadata = ? WHERE id = ?",
            (json.dumps({"totalChunks": total_chunks}), job["id"]),
        )
        conn.commit()
    finally:
        conn.close()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/chunk.py
git commit -m "feat: add Python audio chunking module"
```

---

## Task 6: Python Worker — transcribe.py (faster-whisper)

**Files:**
- Create: `scripts/lib/transcribe.py`

- [ ] **Step 1: Create transcription module**

```python
"""Transcribe audio chunks using faster-whisper.
Replaces nodejs-whisper (transcribe.worker.ts + scripts/transcribe.js).
"""

import json
from faster_whisper import WhisperModel
from scripts.lib import config, db


# Cache loaded model to avoid reloading between chunks
_model_cache: dict[str, WhisperModel] = {}


def get_model(model_name: str, compute_type: str) -> WhisperModel:
    """Load or retrieve cached whisper model."""
    cache_key = f"{model_name}:{compute_type}"
    if cache_key not in _model_cache:
        _model_cache[cache_key] = WhisperModel(model_name, device="cpu", compute_type=compute_type)
    return _model_cache[cache_key]


def run(job: dict):
    """Transcribe a single audio chunk.
    Each chunk gets its own job with a chunkIndex.
    Timestamps are offset to book-absolute time.
    """
    book_id = job["bookId"]
    chunk_index = job["chunkIndex"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model_name = metadata.get("model", config.get_setting("transcription.whisperModel"))
    compute_type = config.get_setting("transcription.computeType")

    # Get chunk info
    chunk = db.get_audio_chunk(book_id, chunk_index)
    if not chunk:
        raise RuntimeError(f"AudioChunk not found: book={book_id} chunk={chunk_index}")

    chunk_start_ms = int(chunk["startTime"] * 1000)
    chunk_end_ms = int(chunk["endTime"] * 1000)

    # Delete any existing segments for this chunk's time range (idempotency)
    db.delete_transcript_segments_for_chunk(book_id, chunk_start_ms, chunk_end_ms)

    # Load model
    model = get_model(model_name, compute_type)

    # Transcribe
    segments_iter, info = model.transcribe(
        chunk["filePath"],
        beam_size=5,
        word_timestamps=True,
    )

    # Collect segments and save to DB
    transcript_segments = []
    segments_list = list(segments_iter)
    total_segments = len(segments_list)

    for i, segment in enumerate(segments_list):
        # Offset timestamps to book-absolute time (in milliseconds)
        start_ms = chunk_start_ms + int(segment.start * 1000)
        end_ms = chunk_start_ms + int(segment.end * 1000)

        transcript_segments.append({
            "text": segment.text.strip(),
            "startTime": start_ms,
            "endTime": end_ms,
        })

        # Update progress within this chunk
        if total_segments > 0:
            progress = round(((i + 1) / total_segments) * 100, 2)
            db.update_job_progress(job["id"], progress)

    # Batch save all segments for this chunk
    db.save_transcript_segments(book_id, model_name, transcript_segments)

    # If this is the last chunk, update book flag
    total_chunks = job["totalChunks"]
    if total_chunks and chunk_index == total_chunks - 1:
        # Check all transcribe jobs are completed (this one will be marked after return)
        conn = config.get_db()
        try:
            row = conn.execute(
                """SELECT COUNT(*) as pending FROM Job
                   WHERE bookId = ? AND type = 'Transcribe' AND status != 'Completed' AND id != ?""",
                (book_id, job["id"]),
            ).fetchone()
            if row["pending"] == 0:
                db.update_book_flag(book_id, "transcribed", True)
        finally:
            conn.close()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/transcribe.py
git commit -m "feat: add faster-whisper transcription module with chunk support"
```

---

## Task 7: Python Worker — vectorize.py

**Files:**
- Create: `scripts/lib/vectorize.py`

- [ ] **Step 1: Create vectorize module**

Port from `src/server/jobs/workers/vectorize.worker.ts`.

```python
"""Vectorize transcript and store in ChromaDB.
Ports vectorize.worker.ts chunking + embedding logic.
"""

import re
import chromadb
from scripts.lib import config, db


def chunk_transcript(segments: list[dict], max_chunk_duration: int = 300) -> list[dict]:
    """Chunk transcript segments by duration with sentence boundary detection.
    Direct port of vectorize.worker.ts chunkTranscript() (lines 49-122).
    max_chunk_duration is in seconds.
    """
    chunks = []
    current_chunk: list[str] = []
    chunk_start_time = None
    chunk_end_time = None

    for i, segment in enumerate(segments):
        text = segment["text"]
        if not text or not text.strip():
            continue

        if chunk_start_time is None:
            chunk_start_time = segment["startTime"]

        chunk_end_time = segment["endTime"]
        current_chunk.append(text.strip())

        # Check duration (times are in milliseconds)
        duration = (chunk_end_time - chunk_start_time) / 1000

        if duration >= max_chunk_duration and len(current_chunk) > 0:
            # Find sentence boundary
            break_point = _find_sentence_break(current_chunk)

            if break_point != -1:
                chunk_segments = current_chunk[: break_point + 1]
                remaining_count = len(current_chunk) - break_point - 1
                # Calculate the end time for the chunk at break point
                bp_segment_index = i - remaining_count
                bp_end_time = segments[bp_segment_index]["endTime"] if bp_segment_index >= 0 else chunk_end_time

                chunks.append({
                    "text": " ".join(chunk_segments),
                    "startTime": chunk_start_time,
                    "endTime": bp_end_time,
                })

                current_chunk = current_chunk[break_point + 1 :]
                if current_chunk:
                    restart_index = i - len(current_chunk) + 1
                    chunk_start_time = segments[restart_index]["startTime"] if restart_index < len(segments) else segment["startTime"]
                else:
                    chunk_start_time = None
            elif len(current_chunk) > 1:
                chunk_segments = current_chunk[:-1]
                prev_end = segments[i - 1]["endTime"]
                chunks.append({
                    "text": " ".join(chunk_segments),
                    "startTime": chunk_start_time,
                    "endTime": prev_end,
                })
                current_chunk = [current_chunk[-1]]
                chunk_start_time = segment["startTime"]

    # Final chunk
    if current_chunk:
        chunks.append({
            "text": " ".join(current_chunk),
            "startTime": chunk_start_time or 0,
            "endTime": chunk_end_time or 0,
        })

    return chunks


def _find_sentence_break(texts: list[str]) -> int:
    """Find last sentence-ending index. Matches findSentenceBreakPoint() (lines 124-134)."""
    for i in range(len(texts) - 1, -1, -1):
        if re.search(r"[.!?]\s*$", texts[i].strip()):
            return i
    return -1


def run(job: dict):
    """Vectorize book transcript.
    Matches vectorize.worker.ts lines 8-41.
    """
    book_id = job["bookId"]

    # Fetch segments from DB
    conn = config.get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM TranscriptSegment WHERE bookId = ? ORDER BY startTime ASC",
            (book_id,),
        ).fetchall()
        segments = [dict(r) for r in rows]
    finally:
        conn.close()

    # Chunk transcript (5-minute chunks by default)
    chunks = chunk_transcript(segments, max_chunk_duration=5 * 60)

    # Initialize ChromaDB
    client = chromadb.HttpClient(
        host=os.environ.get("CHROMA_HOST", "127.0.0.1"),
        port=int(os.environ.get("CHROMA_PORT", "8000")),
    )

    collection_name = f"audiobook_{book_id}"

    # Clear existing collection
    try:
        client.delete_collection(name=collection_name)
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    # Add chunks
    for i, chunk in enumerate(chunks):
        collection.add(
            ids=[f"chunk_{i}"],
            documents=[chunk["text"]],
            metadatas=[{"startTime": chunk["startTime"], "endTime": chunk["endTime"]}],
        )
        db.update_job_progress(job["id"], round(((i + 1) / len(chunks)) * 100, 2))

    db.update_book_flag(book_id, "vectorized", True)
```

- [ ] **Step 2: Fix missing import**

Add at the top of the file:

```python
import os
```

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/vectorize.py
git commit -m "feat: add Python vectorize module with ChromaDB"
```

---

## Task 8: Python Worker — Main Entry Point (worker.py)

**Files:**
- Create: `scripts/worker.py`

- [ ] **Step 1: Create worker main loop**

```python
"""AudioScribe Python Worker — polls SQLite Job table and executes pipeline stages."""

import signal
import sys
import time
import traceback

from scripts.lib import db, config
from scripts.lib import download, audio, chunk, transcribe, vectorize

# Handler registry matching JobType enum
HANDLERS = {
    "Download": download.run,
    "ProcessAudio": audio.run,
    "Chunk": chunk.run,
    "Transcribe": transcribe.run,
    "Vectorize": vectorize.run,
}

running = True


def shutdown(signum, frame):
    global running
    print(f"\n[Worker] Received signal {signum}, shutting down...")
    running = False


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("[Worker] Starting AudioScribe Python worker...")
    print(f"[Worker] Database: {config.DATABASE_PATH}")

    # Recover any stale jobs from previous crash
    db.recover_stale_jobs(timeout_minutes=5)
    print("[Worker] Recovered stale jobs")

    while running:
        job = db.get_next_pending_job()
        if not job:
            time.sleep(2)
            continue

        job_type = job["type"]
        book_id = job["bookId"]
        job_id = job["id"]
        chunk_info = f" chunk {job['chunkIndex']}" if job["chunkIndex"] is not None else ""

        print(f"[Worker] Processing {job_type}{chunk_info} for book {book_id}")

        handler = HANDLERS.get(job_type)
        if not handler:
            db.fail_job(job_id, f"Unknown job type: {job_type}")
            continue

        db.claim_job(job_id)

        try:
            handler(job)
            db.complete_job(job_id)
            print(f"[Worker] Completed {job_type}{chunk_info} for book {book_id}")

            # Check if all jobs for this book are done
            if db.are_all_jobs_completed(book_id):
                db.mark_book_setup_complete(book_id)
                print(f"[Worker] All jobs completed for book {book_id} — setup complete!")

        except Exception as e:
            error_msg = f"{type(e).__name__}: {e}"
            print(f"[Worker] Failed {job_type}{chunk_info} for book {book_id}: {error_msg}")
            traceback.print_exc()
            db.fail_job(job_id, error_msg)

    print("[Worker] Shutdown complete.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/worker.py
git commit -m "feat: add Python worker main entry point with job loop"
```

---

## Task 9: Next.js API — Replace setupBookFlow with Job insertion

**Files:**
- Modify: `src/app/api/book/[id]/setup/route.ts`

- [ ] **Step 1: Rewrite setup route to insert Job rows directly**

Replace the entire contents of `src/app/api/book/[id]/setup/route.ts`:

```typescript
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { getBook } from "@/lib/audiobookshelf"
import { JobStatus, JobType } from "../../../../../../generated/prisma"

const STAGE_ORDER: { type: JobType; sequenceOrder: number }[] = [
  { type: JobType.Download, sequenceOrder: 0 },
  { type: JobType.ProcessAudio, sequenceOrder: 1 },
  { type: JobType.Chunk, sequenceOrder: 2 },
  // Transcribe jobs (sequenceOrder 3) are created dynamically by the chunk worker
  { type: JobType.Vectorize, sequenceOrder: 4 },
]

const TYPE_FLAG: Record<string, string> = {
  Download: "downloaded",
  ProcessAudio: "audioProcessed",
  Transcribe: "transcribed",
  Vectorize: "vectorized",
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body = await request.json()
    const { model, retry } = body as { model: string; retry?: boolean }

    if (!model) {
      return NextResponse.json({ error: "Missing model" }, { status: 400 })
    }

    const book = await getBook(bookId)

    // Ensure book exists in DB
    const existingBook = await prisma.book.findUnique({ where: { id: bookId } })
    if (!existingBook) {
      await prisma.book.create({ data: { id: bookId, model } })
    }

    let stagesToRun = STAGE_ORDER

    if (retry) {
      // Find completed jobs and skip those stages
      const completedJobs = await prisma.job.findMany({
        where: { bookId, status: JobStatus.Completed },
        select: { type: true },
      })
      const completedTypes = new Set(completedJobs.map(j => j.type))

      stagesToRun = STAGE_ORDER.filter(s => !completedTypes.has(s.type))

      // Reset flags for stages we're re-running
      const resetData: Record<string, boolean> = {}
      for (const stage of stagesToRun) {
        const flag = TYPE_FLAG[stage.type]
        if (flag) resetData[flag] = false
      }
      await prisma.book.update({ where: { id: bookId }, data: { ...resetData, model, setup: false } })

      // Delete failed/pending jobs for stages we're re-running
      await prisma.job.deleteMany({
        where: { bookId, type: { in: stagesToRun.map(s => s.type) }, status: { not: JobStatus.Completed } },
      })
    } else {
      // Fresh setup — reset everything
      await prisma.book.update({
        where: { id: bookId },
        data: { downloaded: false, audioProcessed: false, transcribed: false, vectorized: false, model, setup: false },
      })
      await prisma.job.deleteMany({ where: { bookId } })
      await prisma.audioChunk.deleteMany({ where: { bookId } })
    }

    // Create job rows for each stage
    for (const stage of stagesToRun) {
      await prisma.job.create({
        data: {
          bookId,
          type: stage.type,
          sequenceOrder: stage.sequenceOrder,
          metadata: JSON.stringify({ model }),
        },
      })
    }

    return NextResponse.json({ message: "Book setup jobs created" })
  } catch (error) {
    console.error("Setup book API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/book/[id]/setup/route.ts
git commit -m "feat: replace BullMQ flow with direct Job row insertion"
```

---

## Task 10: Next.js API — Update progress endpoint

**Files:**
- Modify: `src/app/api/book/[id]/setup/progress/route.ts`

- [ ] **Step 1: Rewrite progress route to query Job table**

Replace the entire contents:

```typescript
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { JobStatus } from "../../../../../../../generated/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const jobs = await prisma.job.findMany({
      where: { bookId },
      orderBy: [{ sequenceOrder: "asc" }, { chunkIndex: "asc" }],
    })

    if (!jobs.length) {
      return NextResponse.json({ stages: [], currentStage: null })
    }

    // Group jobs by type for stage-level summary
    const stageMap = new Map<string, { status: string; progress: number; error: string | null; startedAt: Date | null; completedAt: Date | null; totalChunks: number; completedChunks: number }>()

    for (const job of jobs) {
      const existing = stageMap.get(job.type)
      if (!existing) {
        stageMap.set(job.type, {
          status: job.status,
          progress: job.progress,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          totalChunks: job.type === "Transcribe" ? 1 : 0,
          completedChunks: job.type === "Transcribe" && job.status === JobStatus.Completed ? 1 : 0,
        })
      } else if (job.type === "Transcribe") {
        // Aggregate transcribe chunk jobs
        existing.totalChunks++
        if (job.status === JobStatus.Completed) {
          existing.completedChunks++
        }
        if (job.status === JobStatus.Running) {
          existing.status = "Running"
          existing.progress = job.progress
          existing.startedAt = existing.startedAt || job.startedAt
        }
        if (job.status === JobStatus.Failed) {
          existing.status = "Failed"
          existing.error = job.error
        }
        // Calculate overall transcribe progress from chunks
        if (existing.totalChunks > 0) {
          existing.progress = Math.round((existing.completedChunks / existing.totalChunks) * 100 * 100) / 100
        }
      }
    }

    // Convert to array format compatible with existing frontend
    const stages = Array.from(stageMap.entries()).map(([type, data]) => ({
      stage: type,
      status: data.status,
      progress: data.progress,
      error: data.error,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      totalChunks: data.totalChunks,
      completedChunks: data.completedChunks,
    }))

    const currentStage = stages.find(s => s.status === "Running") || null
    const book = await prisma.book.findUnique({ where: { id: bookId } })

    return NextResponse.json({ stages, currentStage, book })
  } catch (error) {
    console.error("Setup progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/book/[id]/setup/progress/route.ts
git commit -m "feat: update progress endpoint to query Job table with chunk aggregation"
```

---

## Task 11: Update Processing Info UI — Chunk-Aware Progress

**Files:**
- Modify: `src/app/(authenticated)/(navigation)/(main)/book/[id]/components/processing-info.tsx`

- [ ] **Step 1: Update types and stage definitions**

Replace the `ProgressResponse` type and `stages` array to support the new data shape:

Replace the `ProgressResponse` type (lines 29-34):

```typescript
type StageInfo = {
  stage: string
  status: string
  progress: number
  error: string | null
  startedAt: string | null
  completedAt: string | null
  totalChunks: number
  completedChunks: number
}

type ProgressResponse = {
  stages: StageInfo[]
  currentStage: StageInfo | null
  book: Book | null
}
```

Replace the `stages` definition (lines 96-129):

```typescript
  const stages = [
    {
      stage: "Download",
      title: "Download",
      description: "Download book from Audiobookshelf and save it to the local cache.",
    },
    {
      stage: "ProcessAudio",
      title: "Process Audio",
      description: "Stitch and preprocess audio files for transcription.",
    },
    {
      stage: "Chunk",
      title: "Chunk Audio",
      description: "Split audio into chunks for resumable transcription.",
    },
    {
      stage: "Transcribe",
      title: "Transcribe",
      description: `Transcribe using <span class="font-medium">${data?.book?.model || "Unknown"}</span> model.`,
    },
    {
      stage: "Vectorize",
      title: "Vectorize",
      description: "Create embeddings for AI-powered search and chat.",
    },
  ]
```

- [ ] **Step 2: Update the Stage rendering to show chunk progress**

Replace the `Stage` component's progress rendering (the section at lines 262-272) with chunk-aware display:

```typescript
        {Boolean(progress) && isRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={progress} />
            </TooltipTrigger>
            <TooltipContent>
              {progress !== undefined && <p>Progress: {progress.toFixed(2)}%</p>}
              {totalChunks > 0 && <p>Chunks: {completedChunks}/{totalChunks}</p>}
              {estimated && <p>Estimated: {estimated}</p>}
            </TooltipContent>
          </Tooltip>
        )}
        {isCompleted && totalChunks > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{totalChunks} chunks transcribed</p>
        )}
```

Add `totalChunks` and `completedChunks` to the `StageProps` type and pass them from the parent:

In the `StageProps` type, add:
```typescript
  totalChunks?: number
  completedChunks?: number
```

In the `Stage` component destructuring, add:
```typescript
  totalChunks = 0,
  completedChunks = 0,
```

In the stages.map rendering, pass the new props:
```typescript
  <Stage
    title={`Step ${index + 1}: ${stage.title}`}
    isRunning={data?.currentStage?.stage === stage.stage}
    isCompleted={data?.stages?.some(s => s.stage === stage.stage && s.status === "Completed") ?? false}
    isFailed={data?.stages?.some(s => s.stage === stage.stage && s.status === "Failed") ?? false}
    progress={data?.stages?.find(s => s.stage === stage.stage)?.progress}
    startedAt={data?.stages?.find(s => s.stage === stage.stage)?.startedAt}
    error={data?.stages?.find(s => s.stage === stage.stage)?.error}
    totalChunks={data?.stages?.find(s => s.stage === stage.stage)?.totalChunks ?? 0}
    completedChunks={data?.stages?.find(s => s.stage === stage.stage)?.completedChunks ?? 0}
    isFirst={index === 0}
    isLast={index === stages.length - 1}
  >
```

- [ ] **Step 3: Update polling interval from 1s to 2s**

Change line 38:
```typescript
  const { data } = useSWR<ProgressResponse>(`/api/book/${book.id}/setup/progress`, {
    refreshInterval: 2000,
    revalidateOnFocus: false,
  })
```

- [ ] **Step 4: Remove old enum imports**

Replace the import of Prisma enums (line 21):
```typescript
import { Book } from "../../../../../../../../generated/prisma"
```

Remove `BookSetupProgress`, `BookSetupStage`, `BookSetupStatus` from the import since we're using string comparisons now.

Update comparisons: replace `BookSetupStatus.Failed` with `"Failed"`, `BookSetupStatus.Completed` with `"Completed"`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(authenticated)/(navigation)/(main)/book/[id]/components/processing-info.tsx"
git commit -m "feat: update processing UI with chunk-aware progress display"
```

---

## Task 12: Remove Redis, BullMQ, QueueDash, and Node Workers

**Files:**
- Delete: `src/server/jobs/` (entire directory)
- Delete: `src/server/redis.ts`
- Delete: `scripts/transcribe.js`
- Delete: `nodemon.workers.json`
- Delete: `src/app/(authenticated)/(headless)/jobs/` (QueueDash UI)
- Delete: `src/app/api/queuedash/` (QueueDash API)
- Modify: `package.json`

- [ ] **Step 1: Delete the files and directories**

```bash
rm -rf src/server/jobs/
rm -f src/server/redis.ts
rm -f scripts/transcribe.js
rm -f nodemon.workers.json
rm -rf "src/app/(authenticated)/(headless)/jobs/"
rm -rf src/app/api/queuedash/
```

- [ ] **Step 2: Remove npm dependencies**

```bash
pnpm remove bullmq ioredis nodejs-whisper audioconcat fluent-ffmpeg @queuedash/api @queuedash/ui @types/fluent-ffmpeg
```

- [ ] **Step 3: Remove worker scripts from package.json**

In `package.json`, remove these scripts:
- `"dev:workers"` line
- `"start:workers"` line

Update `"dev:all"` to remove the workers part:
```json
"dev:all": "concurrently \"pnpm dev\" \"python3 scripts/worker.py\" \"pnpm chroma\""
```

- [ ] **Step 4: Check for remaining imports of deleted modules**

```bash
grep -r "from.*server/redis" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*server/jobs" src/ --include="*.ts" --include="*.tsx"
grep -r "bullmq\|ioredis\|nodejs-whisper\|queuedash\|audioconcat\|fluent-ffmpeg" src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining references found.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Redis, BullMQ, QueueDash, Node workers, and nodejs-whisper"
```

---

## Task 13: Remove BookSetupProgress references

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/audiobookshelf.ts`
- Modify: any files that reference `BookSetupProgress`

- [ ] **Step 1: Keep BookSetupProgress model in schema for now**

We keep the `BookSetupProgress` model temporarily so existing data isn't lost, but stop using it. The `Job` model replaces its functionality. A future migration can drop it.

- [ ] **Step 2: Update audiobookshelf.ts references**

In `src/lib/audiobookshelf.ts`, the `getBookFromDatabase` function (line 68) includes `bookSetupProgress`. Update it to include `jobs` instead:

Replace line 71-72:
```typescript
    include: {
      bookSetupProgress: true,
    },
```
with:
```typescript
    include: {
      jobs: {
        orderBy: [{ sequenceOrder: "asc" }, { chunkIndex: "asc" }],
      },
    },
```

Update references in return values (search for `bookSetupProgress` in the file and replace with `jobs`).

- [ ] **Step 3: Search for any other BookSetupProgress references**

```bash
grep -r "BookSetupProgress\|bookSetupProgress" src/ --include="*.ts" --include="*.tsx"
```

Update or remove each reference found.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: replace BookSetupProgress references with Job model"
```

---

## Task 14: Dockerfile — Multi-Stage Build

**Files:**
- Rewrite: `Dockerfile`
- Rewrite: `entrypoint.sh`
- Delete: `supervisord.conf`

- [ ] **Step 1: Rewrite Dockerfile**

```dockerfile
# Stage 1: Install Node dependencies
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Stage 2: Build Next.js application
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build
RUN pnpm prune --prod

# Stage 3: Install Python dependencies
FROM python:3.12-slim AS python
RUN pip install --no-cache-dir \
    faster-whisper>=1.1.0 \
    chromadb>=1.0.0 \
    piper-tts==1.2.0 \
    requests>=2.32.0

# Stage 4: Runtime
FROM node:24-slim AS runtime
WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sqlite3 \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy built Next.js app + prod node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public

# Copy Python environment from python stage
COPY --from=python /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/dist-packages
COPY --from=python /usr/local/bin /usr/local/bin

# Copy runtime source files
COPY prisma ./prisma
COPY scripts ./scripts
COPY entrypoint.sh ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="127.0.0.1"
ENV CHROMA_PORT="8000"
ENV CLEANUP_TEMP_FILES="true"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

EXPOSE 3000
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
```

- [ ] **Step 2: Rewrite entrypoint.sh**

```bash
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
```

- [ ] **Step 3: Delete supervisord.conf**

```bash
rm -f supervisord.conf
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile entrypoint.sh
git rm -f supervisord.conf
git commit -m "refactor: multi-stage Dockerfile, remove Redis/supervisor, build at build-time"
```

---

## Task 15: Settings API Route

**Files:**
- Create: `src/app/api/settings/route.ts`

- [ ] **Step 1: Create settings GET/PUT endpoint**

```typescript
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

const DEFAULTS: Record<string, string> = {
  "transcription.chunkDuration": "300",
  "transcription.whisperModel": "large-v3",
  "transcription.computeType": "int8",
}

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) {
      result[s.key] = s.value
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>

    for (const [key, value] of Object.entries(body)) {
      if (!(key in DEFAULTS)) continue
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }

    return NextResponse.json({ message: "Settings updated" })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/settings/route.ts
git commit -m "feat: add settings API route for transcription configuration"
```

---

## Task 16: Update Makefile

**Files:**
- Modify: `Makefile`

- [ ] **Step 1: Update Makefile targets**

Update the `dev` target to include the Python worker. Remove any Redis-related targets.

The `dev` target should become:
```makefile
dev:
	concurrently "pnpm dev" "python3 -m scripts.worker" "pnpm chroma"
```

Remove any targets referencing Redis or supervisor.

- [ ] **Step 2: Commit**

```bash
git add Makefile
git commit -m "chore: update Makefile for Python worker dev workflow"
```

---

## Task 17: Integration Verification

- [ ] **Step 1: Generate Prisma client and verify schema**

```bash
pnpm db:generate
```

Expected: No errors.

- [ ] **Step 2: Install Python dependencies**

```bash
pip3 install -r scripts/requirements.txt
```

Expected: All packages install successfully.

- [ ] **Step 3: Verify no import errors in Next.js**

```bash
pnpm build
```

Expected: Build succeeds with no missing module errors. If there are errors from removed imports (bullmq, ioredis, etc.), trace and fix them.

- [ ] **Step 4: Verify Python worker starts**

```bash
python3 -m scripts.worker &
sleep 3
kill %1
```

Expected: Worker starts, prints startup message, shuts down cleanly.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues from refactor"
```

---

## Task 18: Final Cleanup

- [ ] **Step 1: Search for any remaining dead references**

```bash
grep -r "redis\|bullmq\|queuedash\|nodejs-whisper\|nodemon\.workers\|supervisord\|start:workers\|dev:workers" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.sh" --include="*.conf" . | grep -v node_modules | grep -v ".next"
```

Fix or remove any stale references found (excluding documentation files like the spec and plan).

- [ ] **Step 2: Update CLAUDE.md**

Update the Commands section and Project Structure in `CLAUDE.md` to reflect:
- Remove Redis/BullMQ mentions
- Add `python3 -m scripts.worker` to dev commands
- Update the project structure to show `scripts/lib/` modules
- Remove `src/server/jobs/` from structure

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: final cleanup of stale references and docs"
```
