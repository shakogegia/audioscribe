import { transcribeFullAudioFile } from "@/ai/transcription/transcription"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import { processWithLimit } from "@/lib/parallel"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

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

    const { config, parallelLimit = 1 } = body

    const files = await getBookFiles(bookId)
    const audioFolder = await folders.book(bookId).downloads()

    // Process files with parallel limit
    const transcriptions = await processWithLimit(
      files,
      async file => {
        const transcription = await transcribeFullAudioFile({
          provider: { type: "whisper", model: config.transcriptionModel },
          audioUrl: path.join(audioFolder, file.path),
        })
        return {
          ...file,
          ...transcription,
        }
      },
      parallelLimit
    )

    return NextResponse.json({ transcriptions })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 })
  }
}
