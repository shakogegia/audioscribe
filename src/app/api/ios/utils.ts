import { provider } from "@/ai/providers"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook, getLastPlayedLibraryItemId } from "@/lib/audiobookshelf"
import { generateTTS } from "@/lib/tts"
import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

export async function getLastPlayedBook(request: NextRequest) {
  const lastPlayedLibraryItemId = await getLastPlayedLibraryItemId()

  const book = await getBook(lastPlayedLibraryItemId)
  const currentTime = book.currentTime

  if (!currentTime) {
    throw new Error("No current time found")
  }

  return book
}

export async function respondWithAudio(bookId: string, text: string) {
  const { url: file } = await generateTTS({ bookId, text })

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

export async function getAi(request: NextRequest) {
  const params = {
    provider: request.nextUrl.searchParams.get("provider") as AiProvider | undefined,
    model: request.nextUrl.searchParams.get("model") as AiModel | undefined,
  }

  if (!params.provider || !params.model) {
    throw new Error("Provider and model are required")
  }

  const ai = await provider(params.provider, params.model)

  return ai
}

export async function getAiConfig(request: NextRequest): Promise<{ provider: AiProvider; model: AiModel }> {
  const params = {
    provider: request.nextUrl.searchParams.get("provider") as AiProvider | undefined,
    model: request.nextUrl.searchParams.get("model") as AiModel | undefined,
  }

  if (!params.provider || !params.model) {
    throw new Error("Provider and model are required")
  }

  return { provider: params.provider, model: params.model }
}
