import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { load } from "@/lib/config";

export async function provider(model?: string): Promise<LanguageModel> {
  const config = await load();
  const google = createGoogleGenerativeAI({ apiKey: config?.aiProviders.google.apiKey ?? undefined });
  return google(model ?? "gemini-2.5-flash");
}
