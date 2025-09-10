import { stream } from "@/ai/helpers/stream"
import { provider } from "@/ai/providers"

export async function POST(request: Request) {
  const { messages } = await request.json()

  const ai = await provider("google", "gemini-2.5-flash")
  const result = await stream(ai, messages)

  return result.toUIMessageStreamResponse()
}
