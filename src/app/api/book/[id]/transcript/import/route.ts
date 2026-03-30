import { getBook } from "@/lib/audiobookshelf"
import { NextRequest, NextResponse } from "next/server"
import { Prisma, TranscriptSegment } from "../../../../../../../generated/prisma"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json()
    const { data } = body as { data: string }

    const { segments } = JSON.parse(data) as { segments: TranscriptSegment[] }

    const book = await getBook(id)

    const model = segments[0].model

    // Upsert book record
    const existingBook = await prisma.book.findUnique({ where: { id: book.id } })
    if (!existingBook) {
      await prisma.book.create({ data: { id: book.id, model } })
    }

    // Reset book status flags
    await prisma.book.update({
      where: { id: book.id },
      data: { audioProcessed: false, transcribed: false, downloaded: false },
    })

    // Create transcript segments
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

    // Mark as transcribed
    await prisma.book.update({
      where: { id: book.id },
      data: { transcribed: true, audioProcessed: true },
    })

    return NextResponse.json({ segments })
  } catch (error) {
    console.error("Import transcript API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
