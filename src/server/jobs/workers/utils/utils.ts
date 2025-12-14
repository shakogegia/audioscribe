import { prisma } from "@/lib/prisma"
import { Book, BookSetupStage, BookSetupStatus } from "../../../../../generated/prisma"

const stageToField: Record<BookSetupStage, keyof Book> = {
  [BookSetupStage.Download]: "downloaded",
  [BookSetupStage.ProcessAudio]: "audioProcessed",
  [BookSetupStage.Transcribe]: "transcribed",
  [BookSetupStage.Vectorize]: "vectorized",
}

export async function resetStageProgress(bookId: string, stage: BookSetupStage) {
  await prisma.book.update({ where: { id: bookId }, data: { [stageToField[stage]]: false } })
  await prisma.bookSetupProgress.deleteMany({ where: { bookId, stage } })
  await prisma.bookSetupProgress.create({
    data: { bookId, stage, status: BookSetupStatus.Running, progress: 0, startedAt: new Date() },
  })
}

export async function updateStageProgress(bookId: string, stage: BookSetupStage, progress: number) {
  await prisma.bookSetupProgress.update({
    where: { bookId_stage: { bookId, stage } },
    data: { progress, status: BookSetupStatus.Running },
  })
}

export async function failStageProgress(bookId: string, stage: BookSetupStage, error: string) {
  await prisma.bookSetupProgress.update({
    where: { bookId_stage: { bookId, stage } },
    data: { status: BookSetupStatus.Failed, error, completedAt: new Date() },
  })
}

export async function completeStageProgress(bookId: string, stage: BookSetupStage) {
  await prisma.book.update({ where: { id: bookId }, data: { [stageToField[stage]]: true } })

  await prisma.bookSetupProgress.upsert({
    where: { bookId_stage: { bookId, stage } },
    update: { status: BookSetupStatus.Completed, completedAt: new Date(), progress: 100 },
    create: { bookId, stage, status: BookSetupStatus.Completed, completedAt: new Date(), progress: 100 },
  })
}
