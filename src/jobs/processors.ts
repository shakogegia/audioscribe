import { spawnWorker } from "@/jobs/utils"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"

export async function executeTranscribeJob(data: unknown): Promise<unknown> {
  const { bookId, model } = data as { bookId: string; model: string }

  if (!bookId || !model) {
    throw new Error("Missing required parameter: bookId")
  }

  const book = await getBook(bookId)

  const duration = book.duration

  async function updateProgress(progress: {
    model: string
    percentage: number
    totalDuration: number
    processedDuration: number
    startedAt?: Date
    completedAt?: Date
  }) {
    const existingProgress = await prisma.transcriptProgress.findFirst({ where: { bookId: bookId } })
    console.log("existingProgress", { ...progress, bookId: bookId })
    if (!existingProgress) {
      await prisma.transcriptProgress.create({
        data: {
          bookId: bookId,
          model: progress.model,
          percentage: progress.percentage,
          totalDuration: progress.totalDuration,
          processedDuration: progress.processedDuration,
        },
      })
      return
    }

    await prisma.transcriptProgress.update({
      where: { id: existingProgress.id },
      data: { ...progress, bookId: bookId },
    })
  }

  await prisma.book.upsert({
    where: { id: bookId },
    update: { transcriptionModel: model, updatedAt: new Date(), transcribed: false },
    create: { id: bookId, transcriptionModel: model, transcribed: false },
  })

  await updateProgress({
    model: model,
    percentage: 0,
    totalDuration: duration,
    processedDuration: 0,
    startedAt: new Date(),
  })

  return spawnWorker({
    workerScript: "transcribe.ts",
    args: ["--book-id", bookId, "--model", model],
    logPrefix: "Transcribe Job",
    onComplete: () => {
      updateProgress({
        percentage: 100,
        totalDuration: duration,
        processedDuration: duration,
        model: model,
      })
    },
    onError: error => {
      updateProgress({
        percentage: 0,
        totalDuration: duration,
        processedDuration: 0,
        model: model,
      })
    },
    // log: (message: string) => {
    //   // Find the last timestamp efficiently using regex
    //   const timestampRegex = /\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]/g
    //   let lastTimestamp = ""
    //   let match

    //   // Find all matches and get the last one
    //   while ((match = timestampRegex.exec(message)) !== null) {
    //     lastTimestamp = match[2] // match[2] is the end timestamp
    //   }

    //   if (lastTimestamp) {
    //     const [hours, minutes, seconds] = lastTimestamp.split(".")[0].split(":")
    //     const timestampInSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)

    //     const percentage = (timestampInSeconds / duration) * 100
    //     const progress = {
    //       percentage: percentage,
    //       totalDuration: duration,
    //       processedDuration: timestampInSeconds,
    //       model: model,
    //       completedAt: percentage === 100 ? new Date() : undefined,
    //     }

    //     updateProgress(progress)
    //   }
    // },
  })
}

export async function executeVectorizeJob(data: unknown): Promise<unknown> {
  const { bookId } = data as { bookId: string }

  if (!bookId) {
    throw new Error("Missing required parameter: bookId")
  }

  return spawnWorker({
    workerScript: "vectorize.ts",
    args: ["--book-id", bookId],
    logPrefix: "Vectorize Job",
  })
}
