import { NextRequest, NextResponse } from "next/server"
import { generateTTS } from "@/lib/tts"

interface TTSGenerateRequestBody {
  text: string
  voice?: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body: TTSGenerateRequestBody = await request.json()

    const { text, voice = "en_US-hfc_female-medium" } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const audioBuffer = await generateTTS({ text, voice })

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("TTS generation error:", error)
    return NextResponse.json({ error: "Failed to generate TTS audio" }, { status: 500 })
  }
}
