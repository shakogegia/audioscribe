import { generatePreviouslyOn } from "@/ai/prompts/previously-on"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { NextRequest, NextResponse } from "next/server"
import { getAi, getLastPlayedBook, respondWithAudio } from "../utils"

export async function GET(request: NextRequest) {
  try {
    const ai = await getAi(request)

    const book = await getLastPlayedBook(request)

    // transcripts for last 10 minutes
    const transcripts = await getTranscriptRangeByTime({
      bookId: book.id,
      time: book.currentTime!,
      before: 10 * 60,
    })

    const transcript = transcripts.map(transcript => transcript.text).join(" ")

    const { summary } = await generatePreviouslyOn(ai, {
      transcript,
      context: {
        bookTitle: book.title,
      },
    })

    return await respondWithAudio(book.id, summary)
  } catch (error) {
    console.error("Error generating Previously On summary:", error)
    return NextResponse.json(
      {
        error: "Failed to generate Previously On summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
