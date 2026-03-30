"""Vectorize transcript and store in ChromaDB."""

import os
import re
import chromadb
from scripts.lib import config, db


def chunk_transcript(segments: list[dict], max_chunk_duration: int = 300) -> list[dict]:
    """Chunk transcript segments by duration with sentence boundary detection.
    Port of vectorize.worker.ts chunkTranscript().
    max_chunk_duration is in seconds.
    """
    chunks = []
    current_chunk: list[str] = []
    chunk_start_time = None
    chunk_end_time = None

    for i, segment in enumerate(segments):
        text = segment["text"]
        if not text or not text.strip():
            continue

        if chunk_start_time is None:
            chunk_start_time = segment["startTime"]

        chunk_end_time = segment["endTime"]
        current_chunk.append(text.strip())

        duration = (chunk_end_time - chunk_start_time) / 1000

        if duration >= max_chunk_duration and len(current_chunk) > 0:
            break_point = _find_sentence_break(current_chunk)

            if break_point != -1:
                chunk_segments = current_chunk[: break_point + 1]
                remaining_count = len(current_chunk) - break_point - 1
                bp_segment_index = i - remaining_count
                bp_end_time = segments[bp_segment_index]["endTime"] if bp_segment_index >= 0 else chunk_end_time

                chunks.append({
                    "text": " ".join(chunk_segments),
                    "startTime": chunk_start_time,
                    "endTime": bp_end_time,
                })

                current_chunk = current_chunk[break_point + 1:]
                if current_chunk:
                    restart_index = i - len(current_chunk) + 1
                    chunk_start_time = segments[restart_index]["startTime"] if restart_index < len(segments) else segment["startTime"]
                else:
                    chunk_start_time = None
            elif len(current_chunk) > 1:
                chunk_segments = current_chunk[:-1]
                prev_end = segments[i - 1]["endTime"]
                chunks.append({
                    "text": " ".join(chunk_segments),
                    "startTime": chunk_start_time,
                    "endTime": prev_end,
                })
                current_chunk = [current_chunk[-1]]
                chunk_start_time = segment["startTime"]

    if current_chunk:
        chunks.append({
            "text": " ".join(current_chunk),
            "startTime": chunk_start_time or 0,
            "endTime": chunk_end_time or 0,
        })

    return chunks


def _find_sentence_break(texts: list[str]) -> int:
    """Find last sentence-ending index."""
    for i in range(len(texts) - 1, -1, -1):
        if re.search(r"[.!?]\s*$", texts[i].strip()):
            return i
    return -1


def run(job: dict):
    """Vectorize book transcript."""
    book_id = job["bookId"]

    conn = config.get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM TranscriptSegment WHERE bookId = ? ORDER BY startTime ASC",
            (book_id,),
        ).fetchall()
        segments = [dict(r) for r in rows]
    finally:
        conn.close()

    chunks = chunk_transcript(segments, max_chunk_duration=5 * 60)

    client = chromadb.HttpClient(
        host=os.environ.get("CHROMA_HOST", "127.0.0.1"),
        port=int(os.environ.get("CHROMA_PORT", "8000")),
    )

    collection_name = f"audiobook_{book_id}"

    try:
        client.delete_collection(name=collection_name)
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    for i, chunk in enumerate(chunks):
        collection.add(
            ids=[f"chunk_{i}"],
            documents=[chunk["text"]],
            metadatas=[{"startTime": chunk["startTime"], "endTime": chunk["endTime"]}],
        )
        db.update_job_progress(job["id"], round(((i + 1) / len(chunks)) * 100, 2))

    db.update_book_flag(book_id, "vectorized", True)
