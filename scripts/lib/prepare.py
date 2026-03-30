"""Prepare audio for transcription: stitch (if needed) and chunk.

Uses -c copy (no re-encoding) for speed. faster-whisper reads
M4B/MP3/AAC natively, so WAV conversion is unnecessary.
"""

import os
import subprocess
import json
from scripts.lib import config, db
from scripts.lib.download import get_book_files


def _write_concat_list(files: list[str], output_dir: str) -> str:
    """Write an FFmpeg concat list file. Returns path to the list file."""
    list_file = os.path.join(output_dir, "concat_list.txt")
    with open(list_file, "w") as f:
        for filepath in files:
            abs_path = os.path.abspath(filepath)
            escaped = abs_path.replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")
    return list_file


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


def _get_file_ext(files: list[str]) -> str:
    """Get the extension of the first file."""
    _, ext = os.path.splitext(files[0])
    return ext or ".m4b"


def _stitch_and_chunk(files: list[str], chunks_dir: str, chunk_duration: int, job_id: str) -> None:
    """Concat multiple files and split into chunks. No re-encoding."""
    audio_dir = os.path.dirname(chunks_dir)
    concat_list = _write_concat_list(files, audio_dir)
    ext = _get_file_ext(files)
    chunk_pattern = os.path.join(chunks_dir, f"chunk_%04d{ext}")

    print(f"[Prepare] Stitching + chunking {len(files)} files (copy, no transcode)")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c", "copy",
        "-f", "segment", "-segment_time", str(chunk_duration),
        chunk_pattern,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg stitch+chunk failed: {result.stderr}")

    try:
        os.remove(concat_list)
    except OSError:
        pass

    print("[Prepare] Stitch + chunk complete")


def _chunk_single(input_path: str, chunks_dir: str, chunk_duration: int, job_id: str) -> None:
    """Split a single audio file into chunks. No re-encoding — nearly instant."""
    ext = os.path.splitext(input_path)[1] or ".m4b"
    chunk_pattern = os.path.join(chunks_dir, f"chunk_%04d{ext}")

    print(f"[Prepare] Chunking {os.path.basename(input_path)} (copy, no transcode)")

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-c", "copy",
        "-f", "segment", "-segment_time", str(chunk_duration),
        chunk_pattern,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg chunking failed: {result.stderr}")

    print("[Prepare] Chunk complete")


def run(job: dict):
    """Prepare audio: stitch (if multi-file) → chunk. No transcoding."""
    book_id = job["bookId"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model = metadata.get("model", config.get_setting("transcription.whisperModel"))

    chunks_dir = config.book_chunks_dir(book_id)
    chunk_duration = int(config.get_setting("transcription.chunkDuration"))

    print(f"[Prepare] Book {book_id}, chunk duration: {chunk_duration}s")

    # Check if chunks already exist (resume case)
    existing_chunks = [f for f in os.listdir(chunks_dir) if f.startswith("chunk_") and f.endswith((".wav", ".mp3", ".m4b", ".m4a", ".ogg", ".flac"))] if os.path.exists(chunks_dir) else []

    if existing_chunks:
        print(f"[Prepare] Found {len(existing_chunks)} existing chunks, skipping FFmpeg")
    else:
        book_files = get_book_files(book_id)
        downloads_dir = config.book_downloads_dir(book_id)
        files = [os.path.join(downloads_dir, f["path"]) for f in book_files]

        print(f"[Prepare] Input files: {len(files)}")

        if len(files) > 1:
            _stitch_and_chunk(files, chunks_dir, chunk_duration, job["id"])
        else:
            _chunk_single(files[0], chunks_dir, chunk_duration, job["id"])

    db.update_job_progress(job["id"], 50)

    # Register chunks in DB
    chunk_files = sorted(
        [f for f in os.listdir(chunks_dir) if f.startswith("chunk_")]
    )
    total_chunks = len(chunk_files)
    print(f"[Prepare] Registering {total_chunks} chunks in DB")

    for i, filename in enumerate(chunk_files):
        chunk_path = os.path.join(chunks_dir, filename)
        chunk_dur = get_audio_duration(chunk_path)
        start_time = i * chunk_duration
        end_time = start_time + chunk_dur
        db.save_audio_chunk(book_id, i, chunk_path, start_time, end_time, chunk_dur)
        db.update_job_progress(job["id"], 50 + ((i + 1) / total_chunks) * 50)

    db.update_book_flag(book_id, "audioProcessed", True)

    # Create transcribe jobs for each chunk
    db.create_transcribe_jobs(book_id, model, total_chunks)
    print(f"[Prepare] Created {total_chunks} transcribe jobs, done!")
