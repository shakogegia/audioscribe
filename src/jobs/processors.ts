import { spawnWorker } from "@/jobs/utils"
import { getBook, getBookFiles } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { folders } from "@/lib/folders"
import fs from "fs"
import path from "path"

export async function executeTranscribeJob(data: unknown): Promise<unknown> {
  const { bookId, model } = data as { bookId: string; model: string }

  if (!bookId || !model) {
    throw new Error("Missing required parameter: bookId")
  }

  const book = await getBook(bookId)

  const duration = book.duration

  // Progress tracking is now handled by BookSetupProgress in the unified setup job

  await prisma.book.upsert({
    where: { id: bookId },
    update: { model: model, updatedAt: new Date(), transcribed: false },
    create: { id: bookId, model: model, transcribed: false },
  })

  console.log(`[Transcribe Job] Starting transcription for book ${bookId} with model ${model}`)

  return spawnWorker({
    workerScript: "transcribe.ts",
    args: ["--book-id", bookId, "--model", model],
    logPrefix: "Transcribe Job",
    onComplete: async () => {
      await prisma.book.update({
        where: { id: bookId },
        data: { transcribed: true },
      })
      console.log(`[Transcribe Job] Transcription completed for book ${bookId}`)
    },
    onError: error => {
      console.error(`[Transcribe Job] Transcription failed for book ${bookId}:`, error)
    },
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

export async function executeSetupBookJob(data: unknown): Promise<unknown> {
  interface SetupBookJobData {
    bookId: string
    model: string
    forceRedownload?: boolean
    forceRetranscribe?: boolean
    forceRevectorize?: boolean
  }

  const {
    bookId,
    model,
    forceRedownload = false,
    forceRetranscribe = false,
    forceRevectorize = false,
  } = data as SetupBookJobData

  if (!bookId || !model) {
    throw new Error("Missing required parameters: bookId, model")
  }

  console.log(`[Setup Book Job] Starting setup for book ${bookId} with model ${model}`)

  async function updateSetupProgress(progress: {
    stage: string
    downloadProgress?: number
    transcriptionProgress?: number
    vectorizationProgress?: number
    overallProgress?: number
    error?: string
    startedAt?: Date
    completedAt?: Date
  }) {
    const existingProgress = await prisma.bookSetupProgress.findFirst({ where: { bookId } })

    if (!existingProgress) {
      await prisma.bookSetupProgress.create({
        data: {
          bookId,
          model,
          ...progress,
        },
      })
      return
    }

    await prisma.bookSetupProgress.update({
      where: { id: existingProgress.id },
      data: progress,
    })
  }

  try {
    await updateSetupProgress({ stage: "downloading", startedAt: new Date() })

    // Stage 1: Download
    await getBook(bookId) // Validate book exists
    const files = await getBookFiles(bookId)
    const audioFolder = await folders.book(bookId).downloads()

    let shouldDownload = forceRedownload
    if (!shouldDownload) {
      // Check if files already exist
      for (const file of files) {
        const filePath = path.join(audioFolder, file.path)
        const exists = await fs.promises
          .access(filePath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)
        if (!exists) {
          shouldDownload = true
          break
        }
      }
    }

    if (shouldDownload) {
      console.log(`[Setup Book Job] Downloading ${files.length} audio files`)
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const response = await fetch(file.downloadUrl)
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        await fs.promises.writeFile(path.join(audioFolder, file.path), Buffer.from(buffer))

        const progress = ((i + 1) / files.length) * 100
        await updateSetupProgress({
          stage: "downloading",
          downloadProgress: progress,
          overallProgress: progress * 0.1, // Download is 10% of overall progress
        })
      }

      await prisma.book.upsert({
        where: { id: bookId },
        update: { cached: true },
        create: { id: bookId, cached: true },
      })

      console.log(`[Setup Book Job] Download completed`)
    } else {
      console.log(`[Setup Book Job] Files already downloaded, skipping`)
      await updateSetupProgress({
        stage: "downloading",
        downloadProgress: 100,
        overallProgress: 10,
      })
    }

    // Stage 2: Transcription
    await updateSetupProgress({ stage: "transcribing" })

    let shouldTranscribe = forceRetranscribe
    if (!shouldTranscribe) {
      const existingBook = await prisma.book.findUnique({ where: { id: bookId } })
      shouldTranscribe = !existingBook?.transcribed || existingBook.model !== model
    }

    if (shouldTranscribe) {
      console.log(`[Setup Book Job] Starting transcription with model ${model}`)

      await prisma.book.upsert({
        where: { id: bookId },
        update: { transcribed: false, model },
        create: { id: bookId, transcribed: false, model },
      })

      // Clean up old transcripts
      await prisma.transcriptSegment.deleteMany({ where: { bookId } })

      await spawnWorker({
        workerScript: "transcribe.ts",
        args: ["--book-id", bookId, "--model", model],
        logPrefix: "Setup Book - Transcribe",
        onComplete: async () => {
          await prisma.book.update({
            where: { id: bookId },
            data: { transcribed: true },
          })
          console.log(`[Setup Book Job] Transcription completed`)
        },
        onError: async error => {
          await updateSetupProgress({
            stage: "failed",
            error: `Transcription failed: ${error}`,
            overallProgress: 50,
          })
          throw error
        },
      })

      await updateSetupProgress({
        stage: "transcribing",
        transcriptionProgress: 100,
        overallProgress: 60, // Transcription completes at 60% overall
      })
    } else {
      console.log(`[Setup Book Job] Already transcribed with correct model, skipping`)
      await updateSetupProgress({
        stage: "transcribing",
        transcriptionProgress: 100,
        overallProgress: 60,
      })
    }

    // Stage 3: Vectorization
    await updateSetupProgress({ stage: "vectorizing" })

    let shouldVectorize = forceRevectorize
    if (!shouldVectorize) {
      const existingBook = await prisma.book.findUnique({ where: { id: bookId } })
      shouldVectorize = !existingBook?.vectorized
    }

    if (shouldVectorize) {
      console.log(`[Setup Book Job] Starting vectorization`)

      await spawnWorker({
        workerScript: "vectorize.js",
        args: ["--book-id", bookId],
        logPrefix: "Setup Book - Vectorize",
        onComplete: async () => {
          await prisma.book.update({
            where: { id: bookId },
            data: { vectorized: true },
          })
          console.log(`[Setup Book Job] Vectorization completed`)
        },
        onError: async error => {
          await updateSetupProgress({
            stage: "failed",
            error: `Vectorization failed: ${error}`,
            overallProgress: 80,
          })
          throw error
        },
      })

      await updateSetupProgress({
        stage: "vectorizing",
        vectorizationProgress: 100,
        overallProgress: 100,
      })
    } else {
      console.log(`[Setup Book Job] Already vectorized, skipping`)
      await updateSetupProgress({
        stage: "vectorizing",
        vectorizationProgress: 100,
        overallProgress: 100,
      })
    }

    // Complete
    await updateSetupProgress({
      stage: "completed",
      completedAt: new Date(),
      overallProgress: 100,
    })

    console.log(`[Setup Book Job] Setup completed for book ${bookId}`)
    return { bookId, stage: "completed" }
  } catch (error) {
    console.error(`[Setup Book Job] Setup failed for book ${bookId}:`, error)
    await updateSetupProgress({
      stage: "failed",
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
