"""AudioScribe Python Worker — polls SQLite Job table and executes pipeline stages."""

import signal
import sys
import time
import traceback

from scripts.lib import db, config
from scripts.lib import download, audio, chunk, transcribe

HANDLERS = {
    "Download": download.run,
    "ProcessAudio": audio.run,
    "Chunk": chunk.run,
    "Transcribe": transcribe.run,
}

running = True


def shutdown(signum, frame):
    global running
    print(f"\n[Worker] Received signal {signum}, shutting down...")
    running = False


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("[Worker] Starting AudioScribe Python worker...")
    print(f"[Worker] Database: {config.DATABASE_PATH}")

    db.recover_stale_jobs(timeout_minutes=5)
    print("[Worker] Recovered stale jobs")

    while running:
        job = db.get_next_pending_job()
        if not job:
            time.sleep(2)
            continue

        job_type = job["type"]
        book_id = job["bookId"]
        job_id = job["id"]
        chunk_info = f" chunk {job['chunkIndex']}" if job["chunkIndex"] is not None else ""

        print(f"[Worker] Processing {job_type}{chunk_info} for book {book_id}")

        handler = HANDLERS.get(job_type)
        if not handler:
            db.fail_job(job_id, f"Unknown job type: {job_type}")
            continue

        db.claim_job(job_id)

        try:
            handler(job)
            db.complete_job(job_id)
            print(f"[Worker] Completed {job_type}{chunk_info} for book {book_id}")

            if db.are_all_jobs_completed(book_id):
                db.mark_book_setup_complete(book_id)
                print(f"[Worker] All jobs completed for book {book_id} — setup complete!")

        except Exception as e:
            error_msg = f"{type(e).__name__}: {e}"
            print(f"[Worker] Failed {job_type}{chunk_info} for book {book_id}: {error_msg}")
            traceback.print_exc()
            db.fail_job(job_id, error_msg)

    print("[Worker] Shutdown complete.")


if __name__ == "__main__":
    main()
