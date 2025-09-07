import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const progress = await prisma.transcriptProgress.findFirst({
      where: { bookId },
    })

    return NextResponse.json({ progress: progress })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 })
  }
}
