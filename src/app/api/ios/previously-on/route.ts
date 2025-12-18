import { generatePrompt } from "@/ai/prompts/helpers"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { NextRequest, NextResponse } from "next/server"
import { getAiConfig, getLastPlayedBook, respondWithAudio } from "../utils"

export async function GET(request: NextRequest) {
  try {
    const { provider, model } = await getAiConfig(request)

    const book = await getLastPlayedBook(request)

    // transcripts for last 10 minutes
    const transcripts = await getTranscriptRangeByTime({
      bookId: book.id,
      time: book.currentTime!,
      before: 10 * 60,
    })

    const transcript = transcripts.map(transcript => transcript.text).join(" ")

    const summary = await generatePrompt({
      provider: provider,
      model: model,
      slug: "previously-on",
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
