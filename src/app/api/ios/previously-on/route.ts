import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { getApi, getBook } from "@/lib/audiobookshelf"
import type { Session } from "@/types/audiobookshelf"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { generateTTS } from "@/lib/tts"
import { provider } from "@/ai/providers"
import { generatePreviouslyOn } from "@/ai/prompts/previously-on"
import { AiModel, AiProvider } from "@/ai/types/ai"

export async function GET(request: NextRequest) {
  const params = {
    provider: request.nextUrl.searchParams.get("provider") as AiProvider | undefined,
    model: request.nextUrl.searchParams.get("model") as AiModel | undefined,
  }

  if (!params.provider || !params.model) {
    return NextResponse.json({ error: "Provider and model are required" }, { status: 400 })
  }

  const api = await getApi()

  type SessionResponse = {
    total: number
    numPages: number
    page: number
    itemsPerPage: number
    sessions: Session[]
  }

  // First fetch to get pagination info
  const initialResponse = await api.get<SessionResponse>(`/api/sessions?page=0&itemsPerPage=1`)
  const { total, numPages } = initialResponse.data

  if (total === 0) {
    return NextResponse.json({ error: "No sessions found" }, { status: 404 })
  }

  // Fetch the last page to get the oldest session
  const lastPage = numPages - 1
  const lastPageResponse = await api.get<SessionResponse>(`/api/sessions?page=${lastPage}&itemsPerPage=1`)
  const lastSession = lastPageResponse.data.sessions[0]

  if (!lastSession) {
    return NextResponse.json({ error: "No sessions found" }, { status: 404 })
  }

  // sample
  const book = await getBook("ba3689b4-bd1d-416c-9056-5e344c5632fa")
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
