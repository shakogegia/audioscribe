import { spawnWorker } from "@/jobs/utils"

export async function executeTranscribeJob(data: unknown): Promise<unknown> {
  const { bookId, modelName } = data as { bookId: number; modelName: string }

  if (!bookId) {
    throw new Error("Missing required parameter: bookId")
  }

  const args = ["--book-id", bookId.toString()]

  if (modelName) args.push("--model-name", modelName)

  return spawnWorker({ workerScript: "transcribe.ts", args, logPrefix: "Transcribe Job" })
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
