import { provider as googleProvider } from "@/ai/providers/google"
import { provider as ollamaProvider } from "@/ai/providers/ollama"
import { prisma } from "@/lib/prisma"
import { LanguageModel } from "ai"
import { AiModel, AiProvider, GeminiModel, OllamaModel } from "../types/ai"

export function resolveProvider(model: string): AiProvider {
  if (model.startsWith("gemini-") || model.startsWith("gemma-") || model.startsWith("models/")) {
    return "google"
  }
  return "ollama"
}

export async function getDefaultModel(): Promise<{ provider: AiProvider; model: AiModel }> {
  const setting = await prisma.setting.findUnique({ where: { key: "ai.model" } })
  const model = (setting?.value || "gemini-2.5-flash") as AiModel
  return { provider: resolveProvider(model), model }
}

export async function provider(providerName: AiProvider, model: AiModel): Promise<LanguageModel> {
  switch (providerName.toLowerCase()) {
    case "ollama":
      return ollamaProvider(model as OllamaModel)
    case "google":
      return googleProvider(model as GeminiModel)
    default:
      throw new Error(`Provider ${providerName} not supported`)
  }
}
