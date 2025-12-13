import { getBook } from "@/lib/audiobookshelf"
import { sendNotification } from "@/lib/notification"
import { prisma } from "@/lib/prisma"
import { redis } from "@/server/redis"
import { Worker } from "bullmq"
import { BookSetupStatus } from "../../../../generated/prisma"

type NotificationJobData = {
  bookId: string
  model: string
  action: "setup" | "import-transcript"
}

export const notificationWorker = new Worker(
  "notification",
  async job => {
    const { bookId, model, action } = job.data as NotificationJobData
    const book = await getBook(bookId)

    const stages = await prisma.bookSetupProgress.findMany({
      where: { bookId, status: BookSetupStatus.Completed },
      orderBy: { startedAt: "asc" },
    })

    // total time in milliseconds
    const totalTime = stages.reduce((acc, stage) => {
      if (!stage.completedAt || !stage.startedAt) return acc
      return acc + (stage.completedAt.getTime() - stage.startedAt.getTime())
    }, 0)

    // if time took is less than 1 minute, show in seconds
    // if time took is less than 1 hour, show in minutes and seconds
    // if time took is greater than 1 hour, show in hours, minutes and seconds
    let timeTook = ""
    if (totalTime < 60000) {
      timeTook = `${Math.floor(totalTime / 1000)} seconds`
    } else if (totalTime < 3600000) {
      timeTook = `${Math.floor(totalTime / 60000)} minutes and ${Math.floor((totalTime % 60000) / 1000)} seconds`
    } else {
      timeTook = `${Math.floor(totalTime / 3600000)} hours, ${Math.floor(
        (totalTime % 3600000) / 60000
      )} minutes and ${Math.floor((totalTime % 60000) / 1000)} seconds`
    }

    let title = ""
    let message = ""

    switch (action) {
      case "setup":
        title = `${book.title} is ready`
        message = `Book processing has been completed using ${model} model in ${timeTook}`
        break
      case "import-transcript":
        title = `${book.title} transcript imported`
        message = `Book transcript has been imported using ${model} model in ${timeTook}`
    }

    const attachmentBase64 = book.coverPath
      ? await fetch(book.coverPath)
          .then(res => res.arrayBuffer())
          .then(buffer => Buffer.from(buffer).toString("base64"))
      : null

    await sendNotification(title, message, attachmentBase64)
  },
  { connection: redis }
)
