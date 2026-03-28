import { prisma } from "@/lib/prisma"
import { FlowChildJob, FlowProducer } from "bullmq"
import { BookSetupStage, BookSetupStatus } from "../../../../generated/prisma"

// A FlowProducer constructor takes an optional "connection"
// object otherwise it connects to a local redis instance.
const flowProducer = new FlowProducer()

// Ordered stages for the setup flow
const STAGE_ORDER: BookSetupStage[] = [
  BookSetupStage.Download,
  BookSetupStage.ProcessAudio,
  BookSetupStage.Transcribe,
  BookSetupStage.Vectorize,
]

const STAGE_QUEUE: Record<BookSetupStage, string> = {
  [BookSetupStage.Download]: "download-book",
  [BookSetupStage.ProcessAudio]: "process-audio",
  [BookSetupStage.Transcribe]: "transcribe-book",
  [BookSetupStage.Vectorize]: "vectorize-book",
}

const STAGE_FLAG: Record<BookSetupStage, string> = {
  [BookSetupStage.Download]: "downloaded",
  [BookSetupStage.ProcessAudio]: "audioProcessed",
  [BookSetupStage.Transcribe]: "transcribed",
  [BookSetupStage.Vectorize]: "vectorized",
}

export async function setupBookFlow({
  book,
  model,
  retry,
}: {
  book: { id: string; title: string }
  model: string
  retry?: boolean
}) {
  let stagesToRun = STAGE_ORDER

  if (retry) {
    // Find which stages completed successfully and skip them
    const existingProgress = await prisma.bookSetupProgress.findMany({
      where: { bookId: book.id },
      orderBy: { createdAt: "asc" },
    })

    const completedStages = new Set(
      existingProgress
        .filter(p => p.status === BookSetupStatus.Completed)
        .map(p => p.stage)
    )

    // Find the first non-completed stage
    const firstIncompleteIndex = STAGE_ORDER.findIndex(s => !completedStages.has(s))

    if (firstIncompleteIndex === -1) {
      // All stages completed, nothing to retry
      return
    }

    stagesToRun = STAGE_ORDER.slice(firstIncompleteIndex)

    // Only reset flags for stages we're re-running
    const resetData: Record<string, boolean> = {}
    for (const stage of stagesToRun) {
      resetData[STAGE_FLAG[stage]] = false
    }
    await prisma.book.update({
      where: { id: book.id },
      data: { ...resetData, model },
    })

    // Only clear progress for stages we're re-running
    await prisma.bookSetupProgress.deleteMany({
      where: { bookId: book.id, stage: { in: stagesToRun } },
    })
  } else {
    // Fresh setup — reset everything
    await prisma.book.update({
      where: { id: book.id },
      data: { audioProcessed: false, transcribed: false, vectorized: false, downloaded: false, model },
    })
    await prisma.bookSetupProgress.deleteMany({ where: { bookId: book.id } })
  }

  // Build the flow chain from the stages to run
  // BullMQ flows are built bottom-up: first child runs first
  let currentJob: FlowChildJob | null = null

  for (const stage of stagesToRun) {
    const job: FlowChildJob = {
      name: book.title,
      queueName: STAGE_QUEUE[stage],
      data: { bookId: book.id, model },
      opts: { continueParentOnFailure: false },
      ...(currentJob ? { children: [currentJob] } : {}),
    }
    currentJob = job
  }

  // Add notification job at the end
  const notificationJob: FlowChildJob = {
    name: book.title,
    queueName: "notification",
    data: { bookId: book.id, model, action: "setup" },
    opts: { continueParentOnFailure: false },
    children: [currentJob!],
  }

  await flowProducer.add({
    name: book.title,
    queueName: "setup-book",
    opts: { continueParentOnFailure: false },
    children: [notificationJob],
  })
}
