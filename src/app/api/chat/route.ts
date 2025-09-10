import { stream } from "@/ai/helpers/stream"
import { provider } from "@/ai/providers"
import { getTranscriptRangeByTime } from "@/lib/transcript"
import { GeminiModel } from "@/ai/types/ai"
import { getBook } from "@/lib/audiobookshelf"
import { UIMessage } from "ai"

interface ChatRequestBody {
  messages: UIMessage[]
  bookId: string
  model: GeminiModel
  time?: number // Optional: specific time to get context for, defaults to book.currentTime
}

export async function POST(request: Request) {
  const requestBody = await request.json()
  const { messages, bookId, model, time } = requestBody as ChatRequestBody

  if (!bookId) {
    return new Response(JSON.stringify({ error: "bookId is required" }), { status: 400 })
  }

  if (!model) {
    return new Response(JSON.stringify({ error: "model is required" }), { status: 400 })
  }

  const book = await getBook(bookId)
  const contextTime = time ?? book.currentTime ?? 0

  // Get intelligent context window - more for important sections
  const contextWindow = getContextWindow(contextTime, book.chapters)
  const transcriptSegments = await getTranscriptRangeByTime({
    bookId,
    time: contextTime,
    before: contextWindow.before,
    after: contextWindow.after || 0,
  })

  const ai = await provider("google", model)

  // Build book context from available data
  const bookContext = {
    title: book.title,
    authors: book.authors,
    currentTime: contextTime,
    duration: book.duration,
    chapters: book.chapters,
    recentTranscript: transcriptSegments.map(seg => seg.text).join(" "),
    // conversationHistory: messages.slice(-6).map(msg => ({
    //   role: msg.role as "user" | "assistant",
    //   content:
    //     msg.parts
    //       ?.filter(part => part.type === "text")
    //       .map(part => part.text)
    //       .join(" ") || "",
    // })),
  }

  const result = await stream(ai, messages, bookContext)

  return result.toUIMessageStreamResponse()
}

// Intelligent context window based on chapter boundaries and content type
function getContextWindow(
  contextTime: number,
  chapters: Array<{ title: string; start: number; end: number }>
): { before: number; after?: number } {
  const defaultWindow = { before: 300 } // 5 minutes default

  if (!chapters || chapters.length === 0) {
    return defaultWindow
  }

  // Find current chapter
  const currentChapter = chapters.find(ch => contextTime >= ch.start && contextTime < ch.end)

  if (!currentChapter) {
    return defaultWindow
  }

  // TODO: this is a temporary fix to get the context window
  return { before: currentChapter.start - contextTime, after: 0 }
  /**
   
  // If near chapter start (first 2 minutes), include some from previous chapter
  const chapterProgress = contextTime - currentChapter.start
  if (chapterProgress < 120) {
    // First 2 minutes of chapter
    return { before: 600, after: 180 } // 10 min before, 3 min after
  }

  // If near chapter end (last 2 minutes), include some from next chapter
  const timeUntilChapterEnd = currentChapter.end - contextTime
  if (timeUntilChapterEnd < 120) {
    // Last 2 minutes of chapter
    return { before: 300, after: 300 } // 5 min before, 5 min after
  }

  // Middle of chapter - standard window
  return { before: 420 } // 7 minutes for mid-chapter content
   */
}
