import { load } from "@/lib/config";
import { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { OllamaModel } from "../types/ai";

export async function provider(model?: OllamaModel): Promise<LanguageModel> {
  const config = await load();
  const ollama = createOllama({
    // optional settings, e.g.
    baseURL: config?.aiProviders.ollama.baseUrl ?? "http://localhost:11434/api",
  });
  return ollama(model ?? "llama3.2");
}
