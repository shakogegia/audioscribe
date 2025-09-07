import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const segments = await prisma.transcriptSegment.findMany({
      where: { bookId },
    })

    return NextResponse.json({ segments: segments })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 })
  }
}
