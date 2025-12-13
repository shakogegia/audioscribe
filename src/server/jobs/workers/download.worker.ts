import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import { redis } from "@/server/redis"
import { Worker } from "bullmq"
import { promises as fs } from "node:fs"
import path from "node:path"
import { BookSetupStage } from "../../../../generated/prisma"
import { completeStageProgress, resetStageProgress, updateStageProgress } from "./utils/utils"

type DownloadJobData = {
  bookId: string
  model: string
}

export const downloadWorker = new Worker<DownloadJobData>(
  "download-book",
  async job => {
    const { bookId } = job.data

    await resetStageProgress(bookId, BookSetupStage.Download)

    const files = await getBookFiles(bookId)
    const audioFolder = await folders.book(bookId).downloads()
    // Regular download without progress
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const localPath = path.join(audioFolder, file.path)
      // If file already exists, skip
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
      const progress = Math.round(((index + 1) / files.length) * 100 * 100) / 100

      await updateStageProgress(bookId, BookSetupStage.Download, progress)
    }
    await completeStageProgress(bookId, BookSetupStage.Download)
  },
  { connection: redis }
)
