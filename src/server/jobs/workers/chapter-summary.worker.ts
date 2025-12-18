import { generatePrompt } from "@/ai/prompts/helpers"
import { getBook } from "@/lib/audiobookshelf"
import { getTranscriptByRange } from "@/lib/transcript"
import { redis } from "@/server/redis"
import { Worker } from "bullmq"
import { ChapterSummaryJobData } from "../queues/chapter-summary.queue"
import { prisma } from "@/lib/prisma"
import { ChapterSummaryStatus } from "@/generated/prisma"

export const chapterSummaryWorker = new Worker(
  "chapter-summary",
  async job => {
    const { bookId, chapterId, provider, model } = job.data as ChapterSummaryJobData

    try {
      const book = await getBook(bookId)

      if (!book) {
        throw new Error("Book not found")
      }

      const chapter = book.chapters.find(chapter => chapter.id === chapterId)
      if (!chapter) {
        throw new Error("Chapter not found")
      }

      // Reset chapter summary status
      await updateChapterSummary(bookId, chapterId, ChapterSummaryStatus.Running, "", model)

      const transcripts = await getTranscriptByRange({
        bookId,
        startTime: chapter.start,
        endTime: chapter.end,
      })

      const transcript = transcripts.map(transcript => transcript.text).join(" ")

      const summary = await generatePrompt({
        provider,
        model,
        slug: "chapter-summary",
        params: {
          transcript,
        },
      })

      await updateChapterSummary(bookId, chapterId, ChapterSummaryStatus.Completed, summary, model)
    } catch (error) {
      await updateChapterSummary(bookId, chapterId, ChapterSummaryStatus.Failed, "", model)
      throw error
    }
  },
  { connection: redis }
)

async function updateChapterSummary(
  bookId: string,
  chapterId: number,
  status: ChapterSummaryStatus,
  summary: string,
  model: string
) {
  const chapterSummary = await prisma.chapterSummary.findFirst({
    where: {
      AND: [{ bookId }, { chapterId }],
    },
  })

  if (!chapterSummary) {
    throw new Error("Chapter summary not found")
  }

  await prisma.chapterSummary.update({
    where: { id: chapterSummary.id },
    data: { status, summary, model },
  })
}
