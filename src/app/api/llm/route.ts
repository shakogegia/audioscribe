import { getModels as getGeminiModels } from "@/ai/managers/gemini"
import { getModels as getOllamaModels } from "@/ai/managers/ollama"
import { load } from "@/lib/config"
import { NextResponse } from "next/server"

export async function GET() {
  const config = await load()

  const google = await getGeminiModels()
  const ollama = await getOllamaModels()

  const result = [
    ...(config.aiProviders.google.enabled ? [{ provider: "Google", models: google }] : []),
    ...(config.aiProviders.ollama.enabled ? [{ provider: "Ollama", models: ollama }] : []),
  ]

  return NextResponse.json(result)
}
