"""AudioScribe Python Worker — polls SQLite Job table and executes pipeline stages."""

import multiprocessing as mp
import queue
import signal
import time
import traceback

from scripts.lib import db, config
from scripts.lib import download, prepare, transcribe

HANDLERS = {
    "Download": download.run,
    "PrepareAudio": prepare.run,
    "Transcribe": transcribe.run,
}

running = True


class JobTimeoutError(Exception):
    pass


def _format_duration(seconds: int) -> str:
    """Format seconds into a friendly human-readable string."""
    if seconds < 60:
        return f"{seconds}s"
    minutes, secs = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m {secs}s"
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h {minutes}m"


def shutdown(signum, frame):
    global running
    print(f"\n[Worker] Received signal {signum}, shutting down...")
    running = False


def _run_handler_in_subprocess(job_type: str, job: dict, result_queue):
    """Execute a job handler in an isolated process and return the result via queue."""
    handler = HANDLERS.get(job_type)
    if not handler:
        result_queue.put({
            "ok": False,
            "error_type": "RuntimeError",
            "error": f"Unknown job type: {job_type}",
            "traceback": "",
        })
        return

    try:
        handler(job)
        result_queue.put({"ok": True})
    except Exception as e:
        result_queue.put({
            "ok": False,
            "error_type": type(e).__name__,
            "error": str(e),
            "traceback": traceback.format_exc(),
        })


def _run_transcribe_job(job: dict):
    """Run transcription in a child process so hung native calls can be terminated."""
    timeout_seconds = transcribe.get_timeout_seconds(job)
    ctx = mp.get_context("spawn")
    result_queue = ctx.Queue()
    process = ctx.Process(
        target=_run_handler_in_subprocess,
        args=("Transcribe", job, result_queue),
    )

    process.start()
    process.join(timeout=timeout_seconds)

    if process.is_alive():
        print(
            f"[Worker] Transcribe chunk {job['chunkIndex']} for book {job['bookId']} "
            f"timed out after {timeout_seconds}s, terminating subprocess..."
        )
        process.terminate()
        process.join(10)
        if process.is_alive():
            process.kill()
            process.join()
        raise JobTimeoutError(f"Transcription timed out after {timeout_seconds}s")

    try:
        result = result_queue.get_nowait()
    except queue.Empty:
        if process.exitcode == 0:
            return
        raise RuntimeError(f"Transcribe subprocess exited with code {process.exitcode}")

    if result["ok"]:
        return

    if result["traceback"]:
        print(result["traceback"], end="")
    raise RuntimeError(f"{result['error_type']}: {result['error']}")


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("[Worker] Starting AudioScribe Python worker...")
    print(f"[Worker] DATA_DIR: {config.DATA_DIR}")
    print(f"[Worker] Database: {config.DATABASE_PATH}")
    print(f"[Worker] Cache: {config.CACHE_DIR}")
    print(f"[Worker] Chunks: {config.CHUNKS_DIR}")

    url, api_key = config.load_audiobookshelf_config()
    print(f"[Worker] Audiobookshelf: {url or 'not configured'}")

    db.recover_stale_jobs(timeout_minutes=5)
    print("[Worker] Recovered stale jobs, polling for work...")

    last_recovery = time.time()

    while running:
        # Periodically recover jobs stuck in Running (e.g. after a hang/crash)
        now = time.time()
        if now - last_recovery > 60:
            db.recover_stale_jobs(timeout_minutes=5)
            last_recovery = now

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
            if job_type == "Transcribe":
                _run_transcribe_job(job)
            else:
                handler(job)
            db.complete_job(job_id)
            print(f"[Worker] Completed {job_type}{chunk_info} for book {book_id}")

            if db.are_all_jobs_completed(book_id):
                db.mark_book_setup_complete(book_id)
                title = config.get_book_title(book_id)
                elapsed = db.get_total_processing_seconds(book_id)
                duration = _format_duration(elapsed)
                print(f"[Worker] All jobs completed for book {title} in {duration} — setup complete!")
                cover = config.get_book_cover(book_id)
                config.send_notification("AudioScribe", f"{title} is ready ({duration})", image=cover)

        except Exception as e:
            error_msg = f"{type(e).__name__}: {e}"
            print(f"[Worker] Failed {job_type}{chunk_info} for book {book_id}: {error_msg}")
            traceback.print_exc()
            db.fail_job(job_id, error_msg)

    print("[Worker] Shutdown complete.")


if __name__ == "__main__":
    main()
