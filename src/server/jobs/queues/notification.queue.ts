import { redis } from "@/server/redis"
import { Queue } from "bullmq"

type NotificationJobData = {
  bookId: string
  model: string
}

export const notificationQueue = new Queue<NotificationJobData>("notification", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
