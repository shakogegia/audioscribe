import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { getBook } from "@/lib/audiobookshelf"
import { JobStatus, JobType } from "../../../../../../generated/prisma"

const STAGE_ORDER: { type: JobType; sequenceOrder: number }[] = [
  { type: JobType.Download, sequenceOrder: 0 },
  { type: JobType.ProcessAudio, sequenceOrder: 1 },
  { type: JobType.Chunk, sequenceOrder: 2 },
  // Transcribe jobs (sequenceOrder 3) are created dynamically by the chunk worker
  { type: JobType.Vectorize, sequenceOrder: 4 },
]

const TYPE_FLAG: Record<string, string> = {
  Download: "downloaded",
  ProcessAudio: "audioProcessed",
  Transcribe: "transcribed",
  Vectorize: "vectorized",
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body = await request.json()
    const { model, retry } = body as { model: string; retry?: boolean }

    if (!model) {
      return NextResponse.json({ error: "Missing model" }, { status: 400 })
    }

    const book = await getBook(bookId)

    // Ensure book exists in DB
    const existingBook = await prisma.book.findUnique({ where: { id: bookId } })
    if (!existingBook) {
      await prisma.book.create({ data: { id: bookId, model } })
    }

    let stagesToRun = STAGE_ORDER

    if (retry) {
      // Find completed jobs and skip those stages
      const completedJobs = await prisma.job.findMany({
        where: { bookId, status: JobStatus.Completed },
        select: { type: true },
      })
      const completedTypes = new Set(completedJobs.map(j => j.type))

      stagesToRun = STAGE_ORDER.filter(s => !completedTypes.has(s.type))

      // Reset flags for stages we're re-running
      const resetData: Record<string, boolean> = {}
      for (const stage of stagesToRun) {
        const flag = TYPE_FLAG[stage.type]
        if (flag) resetData[flag] = false
      }
      await prisma.book.update({ where: { id: bookId }, data: { ...resetData, model, setup: false } })

      // Delete failed/pending jobs for stages we're re-running
      await prisma.job.deleteMany({
        where: { bookId, type: { in: stagesToRun.map(s => s.type) }, status: { not: JobStatus.Completed } },
      })
    } else {
      // Fresh setup — reset everything
      await prisma.book.update({
        where: { id: bookId },
        data: { downloaded: false, audioProcessed: false, transcribed: false, vectorized: false, model, setup: false },
      })
      await prisma.job.deleteMany({ where: { bookId } })
      await prisma.audioChunk.deleteMany({ where: { bookId } })
    }

    // Create job rows for each stage
    for (const stage of stagesToRun) {
      await prisma.job.create({
        data: {
          bookId,
          type: stage.type,
          sequenceOrder: stage.sequenceOrder,
          metadata: JSON.stringify({ model }),
        },
      })
    }

    return NextResponse.json({ message: "Book setup jobs created" })
  } catch (error) {
    console.error("Setup book API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
