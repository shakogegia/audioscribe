import { Queue } from "bullmq"
import { redis } from "@/server/redis"
import { AiModel, AiProvider } from "@/ai/types/ai"

export type ChapterSummaryJobData = {
  bookId: string
  chapterId: number
  provider: AiProvider
  model: AiModel
}

export const chapterSummaryQueue = new Queue<ChapterSummaryJobData>("chapter-summary", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})
