import { prisma } from "@/lib/prisma"

export enum SetupBookStage {
  Download = "download",
  Transcribe = "transcribe",
  Vectorize = "vectorize",
}

export async function resetBook(bookId: string, model?: string) {
  return prisma.book.upsert({
    where: { id: bookId },
    update: { model, setup: false, updatedAt: new Date() },
    create: { id: bookId, model, setup: false },
  })
}

export async function resetBookStages(bookId: string, model: string, stages: SetupBookStage[]) {
  await prisma.bookSetupProgress.deleteMany({ where: { AND: [{ bookId }, { stage: { in: stages } }] } })

  for (const stage of stages) {
    await prisma.bookSetupProgress.upsert({
      where: { bookId_stage: { bookId, stage } },
      update: {},
      create: { bookId, stage, model, status: "pending" },
    })
  }
}

export async function updateStageProgress(
  bookId: string,
  stage: string,
  model: string,
  updates: {
    status?: string
    progress?: number
    error?: string
    startedAt?: Date
    completedAt?: Date
  }
) {
  return prisma.bookSetupProgress.upsert({
    where: { bookId_stage: { bookId, stage } },
    update: updates,
    create: {
      bookId,
      stage,
      model,
      ...updates,
    },
  })
}

export async function updateBookStatus(bookId: string, updates: { setup?: boolean }) {
  return prisma.book.update({
    where: { id: bookId },
    data: updates,
  })
}
