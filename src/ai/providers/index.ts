import { provider as googleProvider } from "@/ai/providers/google"
import { provider as ollamaProvider } from "@/ai/providers/ollama"
import { LanguageModel } from "ai"
import { AiModel, AiProvider, GeminiModel, OllamaModel } from "../types/ai"

export async function provider(provider: AiProvider, model: AiModel): Promise<LanguageModel> {
  switch (provider.toLowerCase()) {
    case "ollama":
      return ollamaProvider(model as OllamaModel)
    case "google":
      return googleProvider(model as GeminiModel)
    default:
      throw new Error(`Provider ${provider} not supported`)
  }
}
