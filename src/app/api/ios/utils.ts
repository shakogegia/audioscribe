import { getLastPlayedLibraryItemId, getBook } from "@/lib/audiobookshelf"
import { generateTTS } from "@/lib/tts"
import { NextResponse } from "next/server"

export async function getLastPlayedBook() {
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
