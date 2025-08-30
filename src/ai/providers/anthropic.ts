import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";
import { load } from "@/lib/config";

export async function provider(model?: string): Promise<LanguageModel> {
  const config = await load();
  const anthropic = createAnthropic({
    apiKey: config?.aiProviders.anthropic.apiKey ?? undefined,
  });
  return anthropic(model ?? "claude-sonnet-4-20250514");
}
