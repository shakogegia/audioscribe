import { resetBook, resetBookStages, updateBookStatus, updateStageProgress } from "./shared/book-operations"
import { spawnDownloadWorker, spawnTranscribeWorker, spawnVectorizeWorker } from "./shared/worker-utils"

export async function executeSetupBookJob(data: unknown): Promise<unknown> {
  const { bookId, model } = data as { bookId: string; model: string }

  if (!bookId || !model) {
    throw new Error("Missing required parameters: bookId, model")
  }

  try {
    await resetBook(bookId, model)
    await resetBookStages(bookId, model)
  } catch (error) {
    throw error
  }

  // 1. Download stage
  try {
    await updateStageProgress(bookId, "download", model, { status: "running", startedAt: new Date() })
    await spawnDownloadWorker(bookId)
    await updateStageProgress(bookId, "download", model, { status: "completed", completedAt: new Date() })
  } catch (error) {
    await updateStageProgress(bookId, "download", model, { status: "failed" })
    throw error
  }

  // 2. Transcribe stage
  try {
    await updateStageProgress(bookId, "transcribe", model, { status: "running", startedAt: new Date() })
    await spawnTranscribeWorker(bookId, model)
    await updateStageProgress(bookId, "transcribe", model, { status: "completed", completedAt: new Date() })
  } catch (error) {
    await updateStageProgress(bookId, "transcribe", model, { status: "failed" })
    throw error
  }

  // 3. Vectorize stage
  try {
    await updateStageProgress(bookId, "vectorize", model, { status: "running", startedAt: new Date() })
    await spawnVectorizeWorker(bookId)
    await updateStageProgress(bookId, "vectorize", model, { status: "completed", completedAt: new Date() })
  } catch (error) {
    await updateStageProgress(bookId, "vectorize", model, { status: "failed" })
    throw error
  }

  // Update book status
  await updateBookStatus(bookId, { setup: true })

  return { bookId, status: "completed" }
}
