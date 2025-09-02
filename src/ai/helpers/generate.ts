import { generateText, LanguageModel } from "ai";

export async function generate(model: LanguageModel, prompt: string): Promise<string> {
  const { text } = await generateText({
    model: model,
    prompt: prompt,
  });

  return text;
}

export type SystemPromptMessage = {
  role: "system" | "user";
  content: string;
};

export async function generateSystemPrompt(model: LanguageModel, messages: SystemPromptMessage[]): Promise<string> {
  const { text } = await generateText({
    model: model,
    messages: messages,
  });

  return text;
}
