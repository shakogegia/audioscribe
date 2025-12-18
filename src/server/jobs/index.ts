// src/server/jobs/index.ts
import "dotenv/config"

// Import workers - this registers them with BullMQ
import { downloadWorker } from "./workers/download.worker"
import { processAudioWorker } from "./workers/process-audio.worker"
import { transcribeWorker } from "./workers/transcribe.worker"
import { vectorizeWorker } from "./workers/vectorize.worker"
import { notificationWorker } from "./workers/notification.worker"
import { chapterSummaryWorker } from "./workers/chapter-summary.worker"

console.log("🚀 Starting BullMQ workers...")
console.log("  - Download Worker: listening on 'download-book' queue")
console.log("  - Process Audio Worker: listening on 'process-audio' queue")
console.log("  - Transcribe Worker: listening on 'transcribe-book' queue")
console.log("  - Vectorize Worker: listening on 'vectorize-book' queue")
console.log("  - Notification Worker: listening on 'notification' queue")
console.log("  - Chapter Summary Worker: listening on 'chapter-summary' queue")
// Graceful shutdown handling
const shutdown = async () => {
  console.log("\n⏳ Shutting down workers...")

  await Promise.all([
    downloadWorker.close(),
    processAudioWorker.close(),
    transcribeWorker.close(),
    vectorizeWorker.close(),
    notificationWorker.close(),
    chapterSummaryWorker.close(),
  ])

  console.log("✅ All workers stopped")
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

// Keep the process alive
console.log("✅ Workers are running. Press Ctrl+C to stop.")
