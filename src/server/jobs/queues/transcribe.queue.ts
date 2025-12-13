import { Queue } from "bullmq"
import { redis } from "@/server/redis"

export const transcribeQueue = new Queue("transcribe-book", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
