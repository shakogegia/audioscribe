// import { setupBook } from "@/server/jobs/queue"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { TranscriptSegment, Prisma } from "../../../../../../../generated/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const body = await request.json()
  const { data } = body as { data: string }

  const transcript = JSON.parse(data) as { segments: TranscriptSegment[] }

  const segments: Prisma.TranscriptSegmentUncheckedCreateInput[] = transcript.segments.map(segment => ({
    bookId: id,
    model: segment.model,
    fileIno: segment.fileIno,
    text: segment.text,
    startTime: segment.startTime,
    endTime: segment.endTime,
  }))

  const model = transcript.segments[0].model

  // await resetBook(id, model)

  // clean up existing segments
  // await resetBookStages(id, model, [SetupBookStage.Transcribe])
  await prisma.transcriptSegment.deleteMany({ where: { bookId: id } })
  await prisma.transcriptSegment.createMany({ data: segments })
  // await updateStageProgress(id, "transcribe", model, { status: "completed", completedAt: new Date() })

  // TODO: Implement this
  // await setupBook({ bookId: id, model, stages: [SetupBookStage.Download, SetupBookStage.Vectorize] })

  return NextResponse.json({ segments })
}
