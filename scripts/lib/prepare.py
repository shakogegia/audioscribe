"""Prepare audio for transcription: stitch, preprocess, and chunk in one step."""

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


def _preprocess(input_path: str, output_path: str, job_id: str, concat_list: str | None = None):
    """Stitch (if multiple files) + preprocess to 16kHz mono WAV with audio filters."""
    if concat_list:
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", concat_list,
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
        ]

    cmd += [
        "-ar", "16000",
        "-ac", "1",
        "-acodec", "pcm_s16le",
        "-af", "highpass=f=80,lowpass=f=8000,volume=1.5,acompressor=threshold=-20dB:ratio=3:attack=1:release=50",
        "-f", "wav",
        "-progress", "pipe:1",
        output_path,
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    for line in process.stdout:
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                out_time_us = int(line.split("=")[1])
                # Cap at 49% — second half is chunking
                db.update_job_progress(job_id, min(out_time_us / 1_000_000, 49))
            except (ValueError, ZeroDivisionError):
                pass

    process.wait()
    if process.returncode != 0:
        stderr = process.stderr.read()
        raise RuntimeError(f"FFmpeg preprocessing failed: {stderr}")

    if concat_list:
        try:
            os.remove(concat_list)
        except OSError:
            pass


def _chunk(processed_path: str, chunks_dir: str, chunk_duration: int, book_id: str, job_id: str) -> int:
    """Split processed WAV into fixed-duration chunks. Returns total chunk count."""
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
        db.update_job_progress(job_id, 50 + ((i + 1) / total_chunks) * 50)

    return total_chunks


def run(job: dict):
    """Prepare audio: stitch → preprocess → chunk, all in one job."""
    book_id = job["bookId"]
    metadata = json.loads(job["metadata"]) if job["metadata"] else {}
    model = metadata.get("model", config.get_setting("transcription.whisperModel"))

    audio_dir = config.book_audio_dir(book_id)
    processed_path = os.path.join(audio_dir, "processed.wav")
    chunks_dir = config.book_chunks_dir(book_id)
    chunk_duration = int(config.get_setting("transcription.chunkDuration"))

    # Step 1: Stitch + preprocess (0-50% progress)
    if not os.path.exists(processed_path):
        book_files = get_book_files(book_id)
        downloads_dir = config.book_downloads_dir(book_id)
        files = [os.path.join(downloads_dir, f["path"]) for f in book_files]

        if len(files) > 1:
            concat_list = _write_concat_list(files, audio_dir)
            _preprocess("", processed_path, job["id"], concat_list=concat_list)
        else:
            _preprocess(files[0], processed_path, job["id"])

    db.update_book_flag(book_id, "audioProcessed", True)

    # Step 2: Chunk (50-100% progress)
    total_chunks = _chunk(processed_path, chunks_dir, chunk_duration, book_id, job["id"])

    # Create transcribe jobs for each chunk
    db.create_transcribe_jobs(book_id, model, total_chunks)
