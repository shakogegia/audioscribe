import { generatePrompt } from "@/ai/prompts/helpers"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook } from "@/lib/audiobookshelf"
import { getTranscriptByOffset } from "@/lib/transcript"
import { millisecondsToTime } from "@/utils/time"
import { NextRequest, NextResponse } from "next/server"

interface BookmarkSuggestionsRequestBody {
  time: number
  offset?: number // in seconds, default is 30, seconds before and after the time to include in the transcript
  config: {
    provider: AiProvider
    model: AiModel
  }
}

// disable cache

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: BookmarkSuggestionsRequestBody = await request.json()

    const { time, offset = 30, config } = body

    const book = await getBook(bookId)

    const segments = await getTranscriptByOffset({ bookId, time, offset })

    const transcript = segments.map(s => `${millisecondsToTime(s.startTime)} ${s.text}`).join("\n\n")

    const response = await generatePrompt({
      provider: config.provider,
      model: config.model,
      slug: "bookmark-suggestions",
      params: {
        transcript: transcript,
        context: {
          bookTitle: book?.title ?? "",
          authors: book?.authors ?? [],
          time: millisecondsToTime(time * 1000),
        },
      },
    })

    const suggestions = parseBookmarkSuggestions(response)

    return NextResponse.json({ suggestions: suggestions, transcript })
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

function parseBookmarkSuggestions(text: string): string[] {
  try {
    // return the array of suggestions
    const jsonString = text.replace(/^```json\n/, "").replace(/\n```$/, "")
    const json = JSON.parse(jsonString)
    return json
  } catch (error) {
    console.error("Error parsing bookmark suggestions:", error)
    return ["Bookmark"] // Fallback
  }
}
