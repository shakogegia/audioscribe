import { Queue } from "bullmq"
import { redis } from "@/server/redis"

type VectorizeJobData = {
  bookId: string
  model: string
}

export const vectorizeQueue = new Queue<VectorizeJobData>("vectorize-book", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
