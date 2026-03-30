import os
import json
import sqlite3

DATA_DIR = os.environ.get("DATA_DIR", "./data")
DATABASE_PATH = os.environ.get("DATABASE_URL", f"file:{DATA_DIR}/sqlite/store.db").replace("file:", "")

# Folder structure matching src/lib/folders.ts
CACHE_DIR = os.path.join(DATA_DIR, "cache")
CHUNKS_DIR = os.path.join(DATA_DIR, "chunks")

# Default settings
DEFAULTS = {
    "transcription.chunkDuration": "300",
    "transcription.whisperModel": "tiny.en",
    "transcription.computeType": "auto",
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


def load_pushover_config():
    """Load Pushover token and user key from config.json."""
    config_path = os.path.join(DATA_DIR, "config.json")
    try:
        with open(config_path) as f:
            cfg = json.load(f)
            pushover = cfg.get("pushover", {})
            return pushover.get("token"), pushover.get("user")
    except (FileNotFoundError, json.JSONDecodeError):
        return None, None


def send_notification(title: str, message: str) -> bool:
    """Send a Pushover notification. Returns True on success."""
    import requests
    token, user = load_pushover_config()
    if not token or not user:
        return False
    try:
        resp = requests.post("https://api.pushover.net/1/messages.json", data={
            "token": token,
            "user": user,
            "title": title,
            "message": message,
        }, timeout=10)
        return resp.status_code == 200
    except Exception as e:
        print(f"[Worker] Failed to send notification: {e}")
        return False


def get_book_title(book_id: str) -> str:
    """Fetch book title from Audiobookshelf API."""
    import requests
    url, api_key = load_audiobookshelf_config()
    if not url or not api_key:
        return book_id
    try:
        resp = requests.get(
            f"{url}/audiobookshelf/api/items/{book_id}",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        item = resp.json()
        return item.get("media", {}).get("metadata", {}).get("title", book_id)
    except Exception:
        return book_id
