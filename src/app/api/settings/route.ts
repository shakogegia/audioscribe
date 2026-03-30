import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

const DEFAULTS: Record<string, string> = {
  "transcription.chunkDuration": "300",
  "transcription.whisperModel": "large-v3",
  "transcription.computeType": "int8",
}

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const s of settings) {
      result[s.key] = s.value
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>

    for (const [key, value] of Object.entries(body)) {
      if (!(key in DEFAULTS)) continue
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }

    return NextResponse.json({ message: "Settings updated" })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
