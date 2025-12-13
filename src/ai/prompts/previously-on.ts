import { LanguageModel } from "ai"
import { generate } from "@/ai/helpers/generate"
import { createPrompt } from "@/ai/helpers/prompt"

export interface PreviouslyOnRequest {
  transcript: string
  context: {
    bookTitle: string
  }
}

export interface PreviouslyOnResponse {
  summary: string
}

/**
 * Generate "Previously On" summary using the configured AI provider
 */
export async function generatePreviouslyOn(
  provider: LanguageModel,
  request: PreviouslyOnRequest
): Promise<PreviouslyOnResponse> {
  try {
    // Create prompt
    const prompt = await createPrompt("previously-on", request)

    // Generate response
    const summary = await generate(provider, prompt)

    // Return response
    return { summary }
  } catch (error) {
    console.error("Error generating Previously On summary:", error)
    throw new Error("Failed to generate Previously On summary")
  }
}
