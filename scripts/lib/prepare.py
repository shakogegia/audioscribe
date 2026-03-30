"""Prepare audio for transcription: stitch (if needed) and chunk."""

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


def _stitch_and_chunk(files: list[str], chunks_dir: str, chunk_duration: int, job_id: str) -> None:
    """Concat multiple files and split into chunks in one FFmpeg pass.
    Converts to WAV (for reliable segment splitting) without heavy filters.
    faster-whisper handles sample rate conversion internally.
    """
    audio_dir = os.path.dirname(chunks_dir)
    concat_list = _write_concat_list(files, audio_dir)
    chunk_pattern = os.path.join(chunks_dir, "chunk_%04d.wav")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le",
        "-f", "segment", "-segment_time", str(chunk_duration),
        "-progress", "pipe:1",
        chunk_pattern,
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    for line in process.stdout:
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                out_time_us = int(line.split("=")[1])
                db.update_job_progress(job_id, min(out_time_us / 1_000_000, 99))
            except (ValueError, ZeroDivisionError):
                pass

    process.wait()
    if process.returncode != 0:
        stderr = process.stderr.read()
        raise RuntimeError(f"FFmpeg stitch+chunk failed: {stderr}")

    try:
        os.remove(concat_list)
    except OSError:
        pass


def _chunk_single(input_path: str, chunks_dir: str, chunk_duration: int, job_id: str) -> None:
    """Split a single audio file into chunks.
    Converts to WAV for reliable segment splitting.
    """
    chunk_pattern = os.path.join(chunks_dir, "chunk_%04d.wav")

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le",
        "-f", "segment", "-segment_time", str(chunk_duration),
        "-progress", "pipe:1",
        chunk_pattern,
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    for line in process.stdout:
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                out_time_us = int(line.split("=")[1])
                db.update_job_progress(job_id, min(out_time_us / 1_000_000, 99))
            except (ValueError, ZeroDivisionError):
                pass

    process.wait()
    if process.returncode != 0:
        stderr = process.stderr.read()
        raise RuntimeError(f"FFmpeg chunking failed: {stderr}")


def run(job: dict):
    """Prepare audio: stitch (if multi-file) → chunk, one FFmpeg pass. No heavy filters."""
    book_id = job["bookId"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model = metadata.get("model", config.get_setting("transcription.whisperModel"))

    chunks_dir = config.book_chunks_dir(book_id)
    chunk_duration = int(config.get_setting("transcription.chunkDuration"))

    # Check if chunks already exist (resume case)
    existing_chunks = [f for f in os.listdir(chunks_dir) if f.startswith("chunk_") and f.endswith(".wav")] if os.path.exists(chunks_dir) else []

    if not existing_chunks:
        book_files = get_book_files(book_id)
        downloads_dir = config.book_downloads_dir(book_id)
        files = [os.path.join(downloads_dir, f["path"]) for f in book_files]

        if len(files) > 1:
            _stitch_and_chunk(files, chunks_dir, chunk_duration, job["id"])
        else:
            _chunk_single(files[0], chunks_dir, chunk_duration, job["id"])

    # Register chunks in DB
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

    db.update_book_flag(book_id, "audioProcessed", True)

    # Create transcribe jobs for each chunk
    db.create_transcribe_jobs(book_id, model, total_chunks)
