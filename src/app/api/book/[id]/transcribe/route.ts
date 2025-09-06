import { WhisperModel } from "@/ai/transcription/types/transription"
import * as queue from "@/jobs/queue"
import { NextRequest, NextResponse } from "next/server"

interface TranscribeRequestBody {
  model: WhisperModel
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: TranscribeRequestBody = await request.json()

    const { model } = body

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    await queue.transcribe({ bookId, model })

    return NextResponse.json({ message: "Transcription job queued" })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 })
  }
}
