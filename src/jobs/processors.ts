import { spawnWorker } from "@/jobs/utils"

export async function executeTranscribeJob(data: unknown): Promise<unknown> {
  const { bookId, model } = data as { bookId: number; model: string }

  if (!bookId || !model) {
    throw new Error("Missing required parameter: bookId")
  }

  return spawnWorker({
    workerScript: "transcribe.ts",
    args: ["--book-id", bookId.toString(), "--model", model],
    logPrefix: "Transcribe Job",
  })
}

export async function executeVectorizeJob(data: unknown): Promise<unknown> {
  const { bookId } = data as { bookId: number }

  if (!bookId) {
    throw new Error("Missing required parameter: bookId")
  }

  return spawnWorker({
    workerScript: "vectorize.ts",
    args: ["--book-id", bookId.toString()],
    logPrefix: "Vectorize Job",
  })
}
