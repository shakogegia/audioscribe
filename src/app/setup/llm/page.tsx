"use server";
import { AppConfig, load, save } from "@/lib/config";
import LLMSetup from "./llm";

// Move updateConfig to a server action and export it
export async function updateConfig(config: AppConfig) {
  "use server";
  await save(config);
}

export default async function LLMSetupPage() {
  const config = await load();

  return <LLMSetup config={config} updateConfig={updateConfig} />;
}
