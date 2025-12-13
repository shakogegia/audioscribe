import { prisma } from "@/lib/prisma"
import { FlowChildJob, FlowProducer } from "bullmq"

// A FlowProducer constructor takes an optional "connection"
// object otherwise it connects to a local redis instance.
const flowProducer = new FlowProducer()

export async function setupBookFlow({ book, model }: { book: { id: string; title: string }; model: string }) {
  const downloadJob: FlowChildJob = {
    name: book.title,
    queueName: "download-book",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
  }

  const processAudioJob: FlowChildJob = {
    name: book.title,
    queueName: "process-audio",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
    children: [downloadJob],
  }

  const transcribeJob: FlowChildJob = {
    name: book.title,
    queueName: "transcribe-book",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
    children: [processAudioJob],
  }

  const vectorizeJob: FlowChildJob = {
    name: book.title,
    queueName: "vectorize-book",
    data: { bookId: book.id, model },
    opts: { continueParentOnFailure: false },
    children: [transcribeJob],
  }

  const notificationJob: FlowChildJob = {
    name: book.title,
    queueName: "notification",
    data: { bookId: book.id, model, action: "setup" },
    opts: { continueParentOnFailure: false },
    children: [vectorizeJob],
  }

  // reset book ready status
  await prisma.book.update({
    where: { id: book.id },
    data: { audioProcessed: false, transcribed: false, vectorized: false, downloaded: false },
  })

  // reset book setup progress
  await prisma.bookSetupProgress.deleteMany({ where: { bookId: book.id } })

  await flowProducer.add({
    name: book.title,
    queueName: "setup-book",
    opts: { continueParentOnFailure: false },
    children: [notificationJob],
  })
}
