import { generateText, LanguageModel } from "ai"

export async function generate(model: LanguageModel, prompt: string): Promise<string> {
  const { text } = await generateText({
    model: model,
    prompt: prompt,
  })

  return text
}
