// import { setupBook } from "@/server/jobs/queue"
import { getBook } from "@/lib/audiobookshelf"
import { importTranscriptFlow } from "@/server/jobs/workers/import-transcript.worker"
import { NextRequest, NextResponse } from "next/server"
import { TranscriptSegment } from "../../../../../../../generated/prisma"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json()
    const { data } = body as { data: string }

    const { segments } = JSON.parse(data) as { segments: TranscriptSegment[] }

    const book = await getBook(id)

    const model = segments[0].model

    await importTranscriptFlow({ book, model, segments })

    return NextResponse.json({ segments })
  } catch (error) {
    console.error("Import transcript API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
