import { getModels as getGeminiModels } from "@/ai/managers/gemini"
import { getModels as getOllamaModels } from "@/ai/managers/ollama"
import { load } from "@/lib/config"
import { NextResponse } from "next/server"

export async function GET() {
  const config = await load()

  const result = [
    ...(config.aiProviders.google.enabled ? [{ provider: "Google", models: await getGeminiModels() }] : []),
    ...(config.aiProviders.ollama.enabled ? [{ provider: "Ollama", models: await getOllamaModels() }] : []),
  ]

  return NextResponse.json(result)
}
