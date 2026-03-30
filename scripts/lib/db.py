import json
import time
import hashlib
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
            "UPDATE Job SET status = 'Running', startedAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?",
            (job_id,),
        )
        db.commit()
    finally:
        db.close()


def update_job_progress(job_id: str, progress: float):
    """Update job progress percentage."""
    db = get_db()
    try:
        db.execute(
            "UPDATE Job SET progress = ?, updatedAt = datetime('now') WHERE id = ?",
            (min(progress, 100.0), job_id),
        )
        db.commit()
    finally:
        db.close()


def complete_job(job_id: str):
    """Mark job as completed."""
    db = get_db()
    try:
        db.execute(
            "UPDATE Job SET status = 'Completed', progress = 100, completedAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?",
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
                "UPDATE Job SET status = 'Pending', attempts = ?, error = ?, progress = 0, updatedAt = datetime('now') WHERE id = ?",
                (attempts, error, job_id),
            )
        else:
            db.execute(
                "UPDATE Job SET status = 'Failed', attempts = ?, error = ?, completedAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?",
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
            """UPDATE Job SET status = 'Pending', progress = 0, updatedAt = datetime('now')
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
        db.execute(
            f"UPDATE Book SET {flag} = ?, updatedAt = datetime('now') WHERE id = ?",
            (value, book_id),
        )
        db.commit()
    finally:
        db.close()


def mark_book_setup_complete(book_id: str):
    """Set book.setup = true when all stages are done."""
    db = get_db()
    try:
        db.execute(
            "UPDATE Book SET setup = 1, updatedAt = datetime('now') WHERE id = ?",
            (book_id,),
        )
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
        for i in range(total_chunks):
            job_id = hashlib.sha256(f"{book_id}-transcribe-{i}-{time.time()}".encode()).hexdigest()[:25]
            db.execute(
                """INSERT INTO Job (id, bookId, type, status, sequenceOrder, chunkIndex, totalChunks, metadata, updatedAt)
                   VALUES (?, ?, 'Transcribe', 'Pending', 2, ?, ?, ?, datetime('now'))""",
                (job_id, book_id, i, total_chunks, json.dumps({"model": model})),
            )
        db.commit()
    finally:
        db.close()


def save_audio_chunk(book_id: str, chunk_index: int, file_path: str, start_time: float, end_time: float, duration: float):
    """Save an audio chunk record."""
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
