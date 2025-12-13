import { redis } from "@/server/redis"
import { Queue } from "bullmq"

export const processAudioQueue = new Queue("process-audio", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
