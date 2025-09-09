import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const segments = await prisma.transcriptSegment.findMany({
    where: { bookId: id },
  })

  if (segments.length === 0) {
    return NextResponse.json({ error: "No segments found" }, { status: 404 })
  }

  const transcript = {
    segments: segments,
    bookId: id,
    model: segments[0].model,
  }

  return NextResponse.json(transcript)
}
