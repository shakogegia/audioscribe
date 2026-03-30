"""Transcribe audio chunks using faster-whisper."""

import json
from faster_whisper import WhisperModel
from scripts.lib import config, db

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

    chunk = db.get_audio_chunk(book_id, chunk_index)
    if not chunk:
        raise RuntimeError(f"AudioChunk not found: book={book_id} chunk={chunk_index}")

    chunk_start_ms = int(chunk["startTime"] * 1000)
    chunk_end_ms = int(chunk["endTime"] * 1000)

    # Delete existing segments for this range (idempotency)
    db.delete_transcript_segments_for_chunk(book_id, chunk_start_ms, chunk_end_ms)

    model = get_model(model_name, compute_type)

    segments_iter, info = model.transcribe(
        chunk["filePath"],
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
    )

    transcript_segments = []
    segments_list = list(segments_iter)
    total_segments = len(segments_list)

    for i, segment in enumerate(segments_list):
        start_ms = chunk_start_ms + int(segment.start * 1000)
        end_ms = chunk_start_ms + int(segment.end * 1000)

        transcript_segments.append({
            "text": segment.text.strip(),
            "startTime": start_ms,
            "endTime": end_ms,
        })

        if total_segments > 0:
            progress = round(((i + 1) / total_segments) * 100, 2)
            db.update_job_progress(job["id"], progress)

    db.save_transcript_segments(book_id, model_name, transcript_segments)

    # Check if this was the last chunk — if so, mark book as transcribed
    total_chunks = job["totalChunks"]
    if total_chunks and chunk_index == total_chunks - 1:
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
