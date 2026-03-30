import { generatePrompt } from "@/ai/prompts/helpers"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { NextResponse } from "next/server"
import { getLastPlayedBook, respondWithAudio } from "../utils"

export async function GET() {
  try {
    const book = await getLastPlayedBook()

    // transcripts for last 10 minutes
    const transcripts = await getTranscriptRangeByTime({
      bookId: book.id,
      time: book.currentTime!,
      before: 10 * 60,
    })

    const transcript = transcripts.map(transcript => transcript.text).join(" ")

    const summary = await generatePrompt({
      slug: "ios-previously-on",
      params: {
        transcript,
        context: { bookTitle: book.title },
      },
    })

    return await respondWithAudio(summary)
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
