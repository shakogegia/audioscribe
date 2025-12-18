import { NextRequest, NextResponse } from "next/server"
import { generateTTS } from "@/lib/tts"

interface TTSPreviewRequestBody {
  text: string
  model: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSPreviewRequestBody = await request.json()

    const { text, model } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    const audioBuffer = await generateTTS({ text, voice: model })

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("TTS preview error:", error)
    return NextResponse.json({ error: "Failed to generate TTS preview" }, { status: 500 })
  }
}
