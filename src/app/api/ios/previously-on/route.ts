import { generatePreviouslyOn } from "@/ai/prompts/previously-on"
import { provider } from "@/ai/providers"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook, getLastPlayedLibraryItemId } from "@/lib/audiobookshelf"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { generateTTS } from "@/lib/tts"
import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

export async function GET(request: NextRequest) {
  const params = {
    provider: request.nextUrl.searchParams.get("provider") as AiProvider | undefined,
    model: request.nextUrl.searchParams.get("model") as AiModel | undefined,
  }

  if (!params.provider || !params.model) {
    return NextResponse.json({ error: "Provider and model are required" }, { status: 400 })
  }

  const lastPlayedLibraryItemId = await getLastPlayedLibraryItemId()

  const book = await getBook(lastPlayedLibraryItemId)
  const currentTime = book.currentTime

  if (!currentTime) {
    return NextResponse.json({ error: "No current time found" }, { status: 404 })
  }

  // transcripts for last 10 minutes
  const transcripts = await getTranscriptRangeByTime({
    bookId: book.id,
    time: currentTime,
    before: 10 * 60,
  })

  const transcript = transcripts.map(transcript => transcript.text).join(" ")

  // Generate AI summary
  const ai = await provider(params.provider, params.model)

  const { summary } = await generatePreviouslyOn(ai, {
    transcript,
    context: {
      bookTitle: book.title,
    },
  })

  const { url: file } = await generateTTS({ bookId: book.id, text: summary })

  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(file)
  const filename = path.basename(file)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  })
}
