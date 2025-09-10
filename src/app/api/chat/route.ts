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
}

export async function POST(request: Request) {
  const { messages, bookId, model } = (await request.json()) as ChatRequestBody

  const book = await getBook(bookId)

  const lastFiveMinuteTranscriptSegments = await getTranscriptRangeByTime({
    bookId,
    time: book.currentTime ?? 0,
    before: 300,
  })

  const ai = await provider("google", model)

  const result = await stream(ai, messages)

  return result.toUIMessageStreamResponse()
}
