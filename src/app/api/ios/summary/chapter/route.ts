import { generateChatSummary } from "@/ai/prompts/chat-summary"
import { getTranscriptByRange } from "@/lib/transcript"
import { NextRequest, NextResponse } from "next/server"
import { getAi, getLastPlayedBook, respondWithAudio } from "../../utils"

export async function GET(request: NextRequest) {
  try {
    const ai = await getAi(request)
    const book = await getLastPlayedBook(request)

    const params = {
      chapter: request.nextUrl.searchParams.get("chapter"),
    } as { chapter: "current" | "previous" }

    if (!params.chapter) {
      throw new Error("Chapter is required")
    }

    if (!["current", "previous"].includes(params.chapter)) {
      throw new Error("Invalid chapter")
    }

    const currentChapter = book.chapters.find(
      chapter => book.currentTime! >= chapter.start && book.currentTime! < chapter.end
    )
    const currentChapterIndex = book.chapters.findIndex(chapter => chapter.id === currentChapter?.id)

    const previousChapter = book.chapters[currentChapterIndex - 1]

    const chapter = params.chapter === "current" ? currentChapter : previousChapter

    if (!chapter) {
      throw new Error("Chapter not found")
    }

    // Get transcript up to current time for current chapter (spoiler-free)
    // Get full transcript for previous chapter
    const transcripts = await getTranscriptByRange({
      bookId: book.id,
      startTime: chapter.start,
      endTime: params.chapter === "current" ? book.currentTime! : chapter.end,
    })

    const transcript = transcripts.map(transcript => transcript.text).join(" ")

    const { summary } = await generateChatSummary(ai, {
      transcript,
      context: {
        bookTitle: book.title,
        chapterType: params.chapter === "current" ? "the current" : "the previous",
      },
    })

    return await respondWithAudio(book.id, summary)
  } catch (error) {
    console.error("Error generating chat summary:", error)
    return NextResponse.json(
      {
        error: "Failed to generate chat summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
