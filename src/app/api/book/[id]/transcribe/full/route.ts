import { transcribeFullAudioFile } from "@/ai/transcription/transcription"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import { processWithLimit } from "@/lib/parallel"
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

interface TranscribeRequestBody {
  parallelLimit?: number
  config: {
    transcriptionModel: WhisperModel
    aiProvider: string
    aiModel: string
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: TranscribeRequestBody = await request.json()

    const { config } = body

    const transcriptsFolder = await folders.book(bookId).transcripts()

    const fullTranscriptPath = path.join(transcriptsFolder, `full-${config.transcriptionModel}.txt`)

    const transcript = await fs.promises.readFile(fullTranscriptPath, "utf8")

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 })
  }
}
