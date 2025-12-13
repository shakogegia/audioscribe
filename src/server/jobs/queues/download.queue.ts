import { Queue } from "bullmq"
import { redis } from "@/server/redis"

type DownloadJobData = {
  bookId: string
  model: string
}

export const downloadQueue = new Queue<DownloadJobData>("download-book", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
