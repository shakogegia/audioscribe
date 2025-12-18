import { generateText, LanguageModel } from "ai"

export async function generate(model: LanguageModel, prompt: string, system?: string): Promise<string> {
  const { text } = await generateText({
    model: model,
    prompt: prompt,
    system: system,
  })

  return text
}
