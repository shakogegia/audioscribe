import { prisma } from "@/lib/prisma"
import { FlowChildJob, FlowProducer } from "bullmq"
import { BookSetupStage, Prisma, TranscriptSegment } from "../../../../generated/prisma"
import { completeStageProgress } from "./utils/utils"

// A FlowProducer constructor takes an optional "connection"
// object otherwise it connects to a local redis instance.
const flowProducer = new FlowProducer()

export async function importTranscriptFlow({
  book,
  model,
  segments,
}: {
  book: { id: string; title: string }
  model: string
  segments: TranscriptSegment[]
}) {
  const downloadJob: FlowChildJob = {
    name: book.title,
    queueName: "download-book",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
  }

  const vectorizeJob: FlowChildJob = {
    name: book.title,
    queueName: "vectorize-book",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
    children: [downloadJob],
  }

  const notificationJob: FlowChildJob = {
    name: book.title,
    queueName: "notification",
    data: { bookId: book.id, model, action: "import-transcript" },
    opts: { continueParentOnFailure: false },
    children: [vectorizeJob],
  }

  // reset book setup progress
  const existingBook = await prisma.book.findUnique({ where: { id: book.id } })
  if (!existingBook) {
    await prisma.book.create({ data: { id: book.id, model } })
  }

  // reset book ready status
  await prisma.book.update({
    where: { id: book.id },
    data: { audioProcessed: false, transcribed: false, vectorized: false, downloaded: false },
  })

  await prisma.bookSetupProgress.deleteMany({ where: { bookId: book.id } })

  // create transcript segments
  const transcriptSegments: Prisma.TranscriptSegmentUncheckedCreateInput[] = segments.map(segment => ({
    bookId: book.id,
    model: segment.model,
    fileIno: segment.fileIno,
    text: segment.text,
    startTime: segment.startTime,
    endTime: segment.endTime,
  }))
  await prisma.transcriptSegment.deleteMany({ where: { bookId: book.id } })
  await prisma.transcriptSegment.createMany({ data: transcriptSegments })

  // complete stages
  await completeStageProgress(book.id, BookSetupStage.Transcribe)
  await completeStageProgress(book.id, BookSetupStage.ProcessAudio)

  await flowProducer.add({
    name: book.title,
    queueName: "import-transcript-book",
    opts: { continueParentOnFailure: false },
    children: [notificationJob],
  })
}
