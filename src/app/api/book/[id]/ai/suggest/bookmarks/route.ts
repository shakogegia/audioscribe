import { generateBookmarkSuggestions } from "@/ai/prompts/bookmark"
import { provider } from "@/ai/providers"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { millisecondsToTime } from "@/utils/time"
import { NextRequest, NextResponse } from "next/server"

interface BookmarkSuggestionsRequestBody {
  time: number
  offset?: number // in seconds, default is 30, seconds before and after the time to include in the transcript
  config: {
    transcriptionModel: WhisperModel
    aiProvider: AiProvider
    aiModel: AiModel
  }
}

// disable cache
export const maxAge = 0

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: BookmarkSuggestionsRequestBody = await request.json()

    const { time, offset = 30, config } = body

    const book = await getBook(bookId)

    const ai = await provider(config.aiProvider, config.aiModel)

    const timeInMilliseconds = time * 1000
    const offsetInMilliseconds = offset * 1000

    const startTimeInMilliseconds = timeInMilliseconds - offsetInMilliseconds
    const endTimeInMilliseconds = timeInMilliseconds + offsetInMilliseconds

    const segments = await prisma.transcriptSegment.findMany({
      where: {
        // TODO: model
        bookId,
        AND: [{ startTime: { gte: startTimeInMilliseconds } }, { endTime: { lte: endTimeInMilliseconds } }],
      },
      orderBy: {
        startTime: "asc",
      },
    })

    const transcript = segments.map(s => `${millisecondsToTime(s.startTime)} ${s.text}`).join("\n\n")

    const { suggestions } = await generateBookmarkSuggestions(ai, {
      transcript: transcript,
      context: {
        bookTitle: book?.title ?? "",
        authors: book?.authors ?? [],
        time: millisecondsToTime(timeInMilliseconds),
      },
    })

    return NextResponse.json({ suggestions: suggestions })
  } catch (error) {
    console.error("AI suggestion error:", error)

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

    return NextResponse.json({ error: "Failed to generate bookmark suggestions" }, { status: 500 })
  }
}
