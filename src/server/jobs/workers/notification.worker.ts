import { getBook } from "@/lib/audiobookshelf"
import { sendNotification } from "@/lib/notification"
import { prisma } from "@/lib/prisma"
import { redis } from "@/server/redis"
import { Worker } from "bullmq"

export const notificationWorker = new Worker(
  "notification",
  async job => {
    const { bookId, model } = job.data
    const book = await getBook(bookId)

    const stages = await prisma.bookSetupProgress.findMany({
      where: { bookId },
      orderBy: { startedAt: "asc" },
    })

    const totalTime = stages.reduce(
      (acc, stage) => acc + (stage.completedAt ? stage.completedAt.getTime() - (stage.startedAt?.getTime() ?? 0) : 0),
      0
    )

    // Round to 2 decimal places
    const timeInMinutes = Math.round((totalTime / 60000) * 100) / 100

    const title = `${book.title} is ready`
    const message = `Book processing has been completed using ${model} model in ${timeInMinutes} minutes`

    const attachmentBase64 = book.coverPath
      ? await fetch(book.coverPath)
          .then(res => res.arrayBuffer())
          .then(buffer => Buffer.from(buffer).toString("base64"))
      : null

    await sendNotification(title, message, attachmentBase64)
  },
  { connection: redis }
)
