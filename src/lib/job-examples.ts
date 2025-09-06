import { transcribe, vectorize, jobQueue } from "../jobs/queue"

export async function queueTranscriptionJob(bookId: number, modelName?: string, audioFile?: string, outputFile?: string) {
  console.log(`Queuing transcription job for book ${bookId}`)

  const jobId = await transcribe({
    bookId,
    modelName,
    audioFilePath: audioFile,
    outputPath: outputFile,
  }, {
    priority: 1,
    maxAttempts: 3,
  })

  console.log(`Transcription job queued with ID: ${jobId}`)
  return jobId
}

export async function queueVectorizationJob(bookId: number) {
  console.log(`Queuing vectorization job for book ${bookId}`)

  const jobId = await vectorize({
    bookId,
  }, {
    priority: 0,
    maxAttempts: 2,
  })

  console.log(`Vectorization job queued with ID: ${jobId}`)
  return jobId
}

export async function getJobStatus(jobId: string) {
  const job = await jobQueue.getJob(jobId)

  if (!job) {
    console.log(`Job ${jobId} not found`)
    return null
  }

  console.log(`Job ${jobId} status: ${job.status}`)
  console.log(`Attempts: ${job.attempts}/${job.maxAttempts}`)

  if (job.error) {
    console.log(`Error: ${job.error}`)
  }

  if (job.result) {
    console.log(`Result: ${job.result}`)
  }

  return job
}

export async function showQueueStats() {
  const stats = await jobQueue.getQueueStats()

  console.log("Queue Statistics:")
  console.log(`- Pending: ${stats.pending}`)
  console.log(`- Running: ${stats.running}`)
  console.log(`- Completed: ${stats.completed}`)
  console.log(`- Failed: ${stats.failed}`)
  console.log(`- Total: ${stats.total}`)

  return stats
}
