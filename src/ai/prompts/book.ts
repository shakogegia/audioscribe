import { generate } from "@/ai/helpers/generate"
import { createPrompt } from "@/ai/helpers/prompt"
import { LanguageModel } from "ai"

export interface BookAnalysisRequest {
  message: string
  transcriptions: { text: string }[]
  context: {
    bookTitle: string
    authors: string[]
  }
}

export interface BookAnalysisResponse {
  analysis: string
}

export async function generateBookAnalysis(
  provider: LanguageModel,
  request: BookAnalysisRequest
): Promise<BookAnalysisResponse> {
  const prompt = await createPrompt("book-query", request)
  const response = await generate(provider, prompt)
  return { analysis: response }
}
