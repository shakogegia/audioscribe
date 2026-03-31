"""Transcribe audio chunks using faster-whisper."""

import json
import signal
from faster_whisper import WhisperModel
from scripts.lib import config, db


class TranscriptionTimeout(Exception):
    pass


def _timeout_handler(signum, frame):
    raise TranscriptionTimeout("Transcription timed out")

_model_cache: dict[str, WhisperModel] = {}


def get_model(model_name: str, compute_type: str) -> WhisperModel:
    """Load or retrieve cached whisper model."""
    cache_key = f"{model_name}:{compute_type}"
    if cache_key not in _model_cache:
        _model_cache[cache_key] = WhisperModel(model_name, device="auto", compute_type=compute_type)
    return _model_cache[cache_key]


def run(job: dict):
    """Transcribe a single audio chunk."""
    book_id = job["bookId"]
    chunk_index = job["chunkIndex"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model_name = metadata.get("model", config.get_setting("transcription.whisperModel"))
    compute_type = config.get_setting("transcription.computeType")

    # Store compute_type in metadata for analytics
    metadata["compute_type"] = compute_type
    db.update_job_metadata(job["id"], json.dumps(metadata))

    chunk = db.get_audio_chunk(book_id, chunk_index)
    if not chunk:
        raise RuntimeError(f"AudioChunk not found: book={book_id} chunk={chunk_index}")

    chunk_start_ms = int(chunk["startTime"] * 1000)
    chunk_end_ms = int(chunk["endTime"] * 1000)

    # Delete existing segments for this range (idempotency)
    db.delete_transcript_segments_for_chunk(book_id, chunk_start_ms, chunk_end_ms)

    model = get_model(model_name, compute_type)

    chunk_duration = chunk["duration"]  # seconds

    # Timeout: allow 10x real-time or 120s minimum, whichever is greater
    timeout_seconds = max(int(chunk_duration * 10), 120)

    segments_iter, info = model.transcribe(
        chunk["filePath"],
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
    )

    # Stream segments from the generator — progress based on timestamp vs chunk duration
    # Use a timeout to prevent hanging on silent/problematic last chunks
    transcript_segments = []
    prev_handler = signal.signal(signal.SIGALRM, _timeout_handler)
    try:
        signal.alarm(timeout_seconds)
        for segment in segments_iter:
            start_ms = chunk_start_ms + int(segment.start * 1000)
            end_ms = chunk_start_ms + int(segment.end * 1000)

            transcript_segments.append({
                "text": segment.text.strip(),
                "startTime": start_ms,
                "endTime": end_ms,
            })

            # Progress based on how far into the chunk we've transcribed
            if chunk_duration > 0:
                progress = min(round((segment.end / chunk_duration) * 100, 2), 99)
                db.update_job_progress(job["id"], progress)
        signal.alarm(0)
    except TranscriptionTimeout:
        signal.alarm(0)
        print(f"[Transcribe] Timeout on chunk {chunk_index} for book {book_id} after {timeout_seconds}s — saving partial results")
    finally:
        signal.signal(signal.SIGALRM, prev_handler)

    db.save_transcript_segments(book_id, model_name, transcript_segments)

    # Check if all transcribe jobs for this book are done (this one is about to be marked Completed)
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
