import { provider } from "@/ai/providers"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook, getLastPlayedLibraryItemId } from "@/lib/audiobookshelf"
import { generateTTS } from "@/lib/tts"
import { NextRequest, NextResponse } from "next/server"

export async function getLastPlayedBook(request: NextRequest) {
  const lastPlayedLibraryItemId = await getLastPlayedLibraryItemId()

  const book = await getBook(lastPlayedLibraryItemId)
  const currentTime = book.currentTime

  if (!currentTime) {
    throw new Error("No current time found")
  }

  return book
}

export async function respondWithAudio(text: string, voice?: string) {
  const audioBuffer = await generateTTS({ text, voice })

  return new NextResponse(audioBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Disposition": 'attachment; filename="audio.wav"',
      "Content-Length": audioBuffer.length.toString(),
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
