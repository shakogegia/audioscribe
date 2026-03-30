"""Download audio files from Audiobookshelf."""

import os
import requests
from scripts.lib import config, db


def get_book_files(book_id: str) -> list[dict]:
    """Fetch audio file list from Audiobookshelf API."""
    url, api_key = config.load_audiobookshelf_config()

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


def run(job: dict):
    """Download all audio files for a book."""
    book_id = job["bookId"]
    downloads_dir = config.book_downloads_dir(book_id)
    files = get_book_files(book_id)

    for index, file in enumerate(files):
        local_path = os.path.join(downloads_dir, file["path"])

        # Skip existing files
        if os.path.exists(local_path):
            continue

        resp = requests.get(file["downloadUrl"], timeout=600)
        resp.raise_for_status()
        with open(local_path, "wb") as f:
            f.write(resp.content)

        progress = round(((index + 1) / len(files)) * 100, 2)
        db.update_job_progress(job["id"], progress)

    db.update_book_flag(book_id, "downloaded", True)
