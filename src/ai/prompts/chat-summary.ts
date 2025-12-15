import { LanguageModel } from "ai"
import { generate } from "@/ai/helpers/generate"
import { createPrompt } from "@/ai/helpers/prompt"

export interface ChatSummaryRequest {
  transcript: string
  context: {
    bookTitle: string
    chapterType: "the current" | "the previous"
  }
}

export interface ChatSummaryResponse {
  summary: string
}

/**
 * Generate chapter summary using the configured AI provider
 */
export async function generateChatSummary(
  provider: LanguageModel,
  request: ChatSummaryRequest
): Promise<ChatSummaryResponse> {
  try {
    // Create prompt
    const prompt = await createPrompt("chat-summary", request)

    // Generate response
    const summary = await generate(provider, prompt)

    // Return response
    return { summary }
  } catch (error) {
    console.error("Error generating chat summary:", error)
    throw new Error("Failed to generate chat summary")
  }
}
