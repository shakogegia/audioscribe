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
    """Split processed audio into chunks and create transcribe jobs."""
    book_id = job["bookId"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model = metadata.get("model", config.get_setting("transcription.whisperModel"))

    audio_dir = config.book_audio_dir(book_id)
    processed_path = os.path.join(audio_dir, "processed.wav")
    chunks_dir = config.book_chunks_dir(book_id)

    chunk_duration = int(config.get_setting("transcription.chunkDuration"))

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

    db.create_transcribe_jobs(book_id, model, total_chunks)
