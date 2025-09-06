import { stream } from "@/ai/helpers/stream"
import { provider } from "@/ai/providers"
import { type UIMessage } from "ai"

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const ai = await provider("google", "gemini-2.5-flash")
  const result = await stream(ai, messages)

  return result.toUIMessageStreamResponse()
}
