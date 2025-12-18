import { generatePrompt } from "@/ai/prompts/helpers"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

interface PreviouslyOnRequestBody {
  currentTime: number // in seconds
  config: {
    provider: AiProvider
    model: AiModel
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: PreviouslyOnRequestBody = await request.json()

    const { currentTime, config } = body

    const book = await getBook(bookId)

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Get last 10 minutes of transcript (600 seconds = 600,000 milliseconds)
    const currentTimeMs = currentTime * 1000
    const tenMinutesAgoMs = currentTimeMs - 10 * 60 * 1000

    const segments = await prisma.transcriptSegment.findMany({
      where: {
        bookId,
        startTime: {
          gte: tenMinutesAgoMs,
          lte: currentTimeMs,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Combine the transcript text
    const transcriptText = segments.map(segment => segment.text).join(" ")

    if (!transcriptText.trim()) {
      return NextResponse.json({ error: "No transcript available for the last 10 minutes" }, { status: 404 })
    }

    // Generate AI summary
    const summary = await generatePrompt({
      provider: config.provider,
      model: config.model,
      slug: "previously-on",
      params: {
        transcript: transcriptText,
        context: { bookTitle: book.title },
      },
    })

    return NextResponse.json({
      summary,
      metadata: {
        bookTitle: book.title,
        timeRange: {
          start: tenMinutesAgoMs / 1000,
          end: currentTimeMs / 1000,
        },
        transcriptLength: transcriptText.length,
        segmentCount: segments.length,
      },
    })
  } catch (error) {
    console.error("Previously On generation error:", error)

    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ error: "AI provider API key not configured or invalid" }, { status: 401 })
      }

      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json({ error: "AI provider quota exceeded. Please try again later." }, { status: 429 })
      }

      if (error.message.includes("network") || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Unable to reach AI provider. Please check your connection." },
          { status: 503 }
        )
      }
    }

    return NextResponse.json({ error: "Failed to generate Previously On summary" }, { status: 500 })
  }
}
