"""Audio stitching and preprocessing via FFmpeg."""

import os
import subprocess
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


def preprocess_audio(input_path: str, output_dir: str, job_id: str, concat_list: str | None = None) -> str:
    """Apply audio filters for transcription quality.
    16kHz mono, highpass, lowpass, volume boost, compression.
    If concat_list is provided, uses concat demuxer to stitch + preprocess in one pass.
    """
    output_path = os.path.join(output_dir, "processed.wav")

    if concat_list:
        # Stitch + preprocess in one pass via concat demuxer
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", concat_list,
            "-ar", "16000",
            "-ac", "1",
            "-acodec", "pcm_s16le",
            "-af", "highpass=f=80,lowpass=f=8000,volume=1.5,acompressor=threshold=-20dB:ratio=3:attack=1:release=50",
            "-f", "wav",
            "-progress", "pipe:1",
            output_path,
        ]
    else:
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
        raise RuntimeError(f"FFmpeg preprocessing failed: {stderr}")

    # Clean up concat list if used
    if concat_list:
        try:
            os.remove(concat_list)
        except OSError:
            pass

    return output_path


def run(job: dict):
    """Process audio for a book."""
    book_id = job["bookId"]
    audio_dir = config.book_audio_dir(book_id)
    processed_path = os.path.join(audio_dir, "processed.wav")

    if os.path.exists(processed_path):
        db.update_book_flag(book_id, "audioProcessed", True)
        return

    book_files = get_book_files(book_id)
    downloads_dir = config.book_downloads_dir(book_id)

    files = [os.path.join(downloads_dir, f["path"]) for f in book_files]

    if len(files) > 1:
        # Stitch + preprocess in one FFmpeg pass (handles mixed formats)
        concat_list = _write_concat_list(files, audio_dir)
        preprocess_audio("", audio_dir, job["id"], concat_list=concat_list)
    else:
        preprocess_audio(files[0], audio_dir, job["id"])

    db.update_book_flag(book_id, "audioProcessed", True)
