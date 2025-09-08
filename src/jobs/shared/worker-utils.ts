import { spawnWorker } from "@/jobs/utils"
import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import fs from "fs/promises"
import path from "path"

export async function spawnDownloadWorker(bookId: string): Promise<boolean> {
  try {
    const files = await getBookFiles(bookId)
    const audioFolder = await folders.book(bookId).downloads()
    // Regular download without progress
    for (const file of files) {
      const localPath = path.join(audioFolder, file.path)

      if (
        await fs
          .access(localPath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)
      ) {
        continue
      }
      const response = await fetch(file.downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      await fs.writeFile(localPath, Buffer.from(buffer))
    }
    return true
  } catch (error) {
    console.error(`[Download Worker] Failed to download files for book ${bookId}:`, error)
    return false
  }
}

export async function spawnTranscribeWorker(bookId: string, model: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    spawnWorker({
      workerScript: "transcribe.ts",
      args: ["--book-id", bookId, "--model", model],
      logPrefix: "Transcribe Job",
      onComplete: async () => {
        resolve(true)
      },
      onError: async error => {
        console.error(`[Transcribe Job] Transcription failed for book ${bookId}:`, error)
        reject(error)
      },
    })
  })
}

export async function spawnVectorizeWorker(bookId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    spawnWorker({
      workerScript: "vectorize.ts",
      args: ["--book-id", bookId],
      logPrefix: "Vectorize Job",
      onComplete: async () => {
        resolve(true)
      },
      onError: async error => {
        console.error(`[Vectorize Job] Vectorization failed for book ${bookId}:`, error)
        reject(error)
      },
    })
  })
}
