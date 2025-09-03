import { load } from "@/lib/config"
import { LanguageModel } from "ai"
import { createOllama } from "ollama-ai-provider-v2"
import { OllamaModel } from "../types/ai"

export async function provider(model?: OllamaModel): Promise<LanguageModel> {
  const config = await load()

  const baseUrl = config?.aiProviders.ollama.baseUrl ?? "http://localhost:11434/api"

  const ollama = createOllama({
    baseURL: baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`,
  })
  return ollama(model ?? "llama3.2")
}
