"""Audio stitching and preprocessing via FFmpeg."""

import os
import subprocess
from scripts.lib import config, db
from scripts.lib.download import get_book_files


def stitch_audio_files(files: list[str], output_dir: str) -> str:
    """Concatenate multiple audio files into one using FFmpeg concat demuxer."""
    output_file = os.path.join(output_dir, "stitched.wav")

    list_file = os.path.join(output_dir, "concat_list.txt")
    with open(list_file, "w") as f:
        for filepath in files:
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
    16kHz mono, highpass, lowpass, volume boost, compression.
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

    for line in process.stdout:
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                out_time_us = int(line.split("=")[1])
                # We don't have total duration here easily, so just report raw progress
                db.update_job_progress(job_id, min(out_time_us / 1_000_000, 99))
            except (ValueError, ZeroDivisionError):
                pass

    process.wait()
    if process.returncode != 0:
        stderr = process.stderr.read()
        raise RuntimeError(f"FFmpeg preprocessing failed: {stderr}")

    try:
        os.remove(input_path)
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
        audio_path = stitch_audio_files(files, audio_dir)
    else:
        audio_path = files[0]

    preprocess_audio(audio_path, audio_dir, job["id"])
    db.update_book_flag(book_id, "audioProcessed", True)
