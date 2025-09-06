import { LanguageModel } from "ai"
import { generate } from "@/ai/helpers/generate"
import { createPrompt } from "@/ai/helpers/prompt"

export interface BookmarkSuggestionRequest {
  transcript: string
  context: {
    bookTitle: string
    authors: string[]
    time: string
  }
}

export interface BookmarkSuggestionResponse {
  suggestions: string[]
}

/**
 * Generate bookmark title suggestions using the configured AI provider
 */
export async function generateBookmarkSuggestions(
  provider: LanguageModel,
  request: BookmarkSuggestionRequest
): Promise<BookmarkSuggestionResponse> {
  try {
    // Create prompt
    const prompt = await createPrompt("bookmark-suggestions", request)

    // Generate response
    const response = await generate(provider, prompt)

    // Parse response
    const suggestions = parseResult(response)

    // Return response
    return { suggestions }
  } catch (error) {
    console.error("Error generating bookmark suggestions:", error)
    throw new Error("Failed to generate bookmark suggestions")
  }
}

/**
 * Parse AI response to extract bookmark suggestions
 * text is the response from the AI provider in format:
 * ```json
 * [
 *   "Title 1",
 *   "Title 2",
 *   "Title 3"
 * ]
 * ```
 */
function parseResult(text: string): string[] {
  try {
    // return the array of suggestions
    const jsonString = text.replace(/^```json\n/, "").replace(/\n```$/, "")
    const json = JSON.parse(jsonString)
    return json
  } catch (error) {
    console.error("Error parsing bookmark suggestions:", error)
    return ["Bookmark"] // Fallback
  }
}
