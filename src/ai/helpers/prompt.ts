import fs from "fs/promises"
import handlebars from "handlebars"
import path from "path"

type TemplateName = "bookmark-suggestions" | "audiobook-chat" | "previously-on" | "chat-summary"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPrompt(template: TemplateName, params: any): Promise<string> {
  const prompt = await fs.readFile(path.join(process.cwd(), "src/prompts", `${template}.txt`), "utf8")
  return handlebars.compile(prompt)(params)
}
