import os
import json
import sqlite3

DATA_DIR = os.environ.get("DATA_DIR", "./data")
DATABASE_PATH = os.environ.get("DATABASE_URL", f"file:{DATA_DIR}/sqlite/store.db").replace("file:", "")

# Folder structure matching src/lib/folders.ts
CACHE_DIR = os.path.join(DATA_DIR, "cache")
CHUNKS_DIR = os.path.join(DATA_DIR, "chunks")

# Job type to sequence order mapping
SEQUENCE_ORDER = {
    "Download": 0,
    "ProcessAudio": 1,
    "Chunk": 2,
    "Transcribe": 3,
    "Vectorize": 4,
}

# Stage to Book flag mapping (matches setup.worker.ts STAGE_FLAG)
STAGE_FLAG = {
    "Download": "downloaded",
    "ProcessAudio": "audioProcessed",
    "Chunk": "audioProcessed",
    "Transcribe": "transcribed",
    "Vectorize": "vectorized",
}

# Default settings
DEFAULTS = {
    "transcription.chunkDuration": "300",
    "transcription.whisperModel": "large-v3",
    "transcription.computeType": "int8",
}


def load_audiobookshelf_config():
    """Load audiobookshelf URL and API key from config.json.
    Returns (url, api_key) tuple.
    """
    config_path = os.path.join(DATA_DIR, "config.json")
    try:
        with open(config_path) as f:
            config = json.load(f)
            url = config.get("audiobookshelf", {}).get("url")
            api_key = config.get("audiobookshelf", {}).get("apiKey")
            return url, api_key
    except (FileNotFoundError, json.JSONDecodeError):
        return None, None


def get_db() -> sqlite3.Connection:
    """Get a SQLite connection with WAL mode enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def book_downloads_dir(book_id: str) -> str:
    path = os.path.join(CACHE_DIR, book_id, "downloads")
    os.makedirs(path, exist_ok=True)
    return path


def book_audio_dir(book_id: str) -> str:
    path = os.path.join(CACHE_DIR, book_id, "audio")
    os.makedirs(path, exist_ok=True)
    return path


def book_chunks_dir(book_id: str) -> str:
    path = os.path.join(CHUNKS_DIR, book_id)
    os.makedirs(path, exist_ok=True)
    return path


def get_setting(key: str) -> str:
    """Get a setting value, falling back to defaults."""
    db = get_db()
    try:
        row = db.execute("SELECT value FROM Setting WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else DEFAULTS.get(key, "")
    finally:
        db.close()
