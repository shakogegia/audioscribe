import {
  resetBook,
  resetBookStages,
  SetupBookStage,
  updateBookStatus,
  updateStageProgress,
} from "../utils/book-operations"
import { spawnDownloadWorker, spawnTranscribeWorker, spawnVectorizeWorker } from "@/server/utils/workers"

export async function executeSetupBookJob(data: unknown, jobId?: string): Promise<unknown> {
  const { bookId, model, stages } = data as { bookId: string; model: string; stages: SetupBookStage[] }

  if (!bookId || !model) {
    throw new Error("Missing required parameters: bookId, model")
  }

  try {
    await resetBook(bookId, model)
    await resetBookStages(bookId, model, stages)
  } catch (error) {
    throw error
  }

  // 1. Download stage
  if (stages.includes(SetupBookStage.Download)) {
    try {
      await updateStageProgress(bookId, "download", model, { status: "running", progress: 0, startedAt: new Date() })
      await spawnDownloadWorker(bookId)
      await updateStageProgress(bookId, "download", model, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      })
    } catch (error) {
      await updateStageProgress(bookId, "download", model, { status: "failed" })
      throw error
    }
  }

  // 2. Transcribe stage
  if (stages.includes(SetupBookStage.Transcribe)) {
    try {
      await updateStageProgress(bookId, "transcribe", model, { status: "running", progress: 0, startedAt: new Date() })
      await spawnTranscribeWorker(bookId, model, jobId)
      await updateStageProgress(bookId, "transcribe", model, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      })
    } catch (error) {
      await updateStageProgress(bookId, "transcribe", model, { status: "failed" })
      throw error
    }
  }

  // 3. Vectorize stage
  if (stages.includes(SetupBookStage.Vectorize)) {
    try {
      await updateStageProgress(bookId, "vectorize", model, { status: "running", progress: 0, startedAt: new Date() })
      await spawnVectorizeWorker(bookId, jobId)
      await updateStageProgress(bookId, "vectorize", model, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      })
    } catch (error) {
      await updateStageProgress(bookId, "vectorize", model, { status: "failed" })
      throw error
    }
  }

  // Update book status
  await updateBookStatus(bookId, { setup: true })

  return { bookId, status: "completed" }
}
