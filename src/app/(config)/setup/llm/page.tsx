"use server"
import { AppConfig, load, save } from "@/lib/config"
import LLMSetup from "./llm"
import { revalidatePath } from "next/cache"

// Move updateConfig to a server action and export it
export async function updateConfig(config: AppConfig) {
  "use server"
  await save(config)
  revalidatePath("/", "layout")
}

export default async function LLMSetupPage() {
  const config = await load()

  return <LLMSetup config={config} updateConfig={updateConfig} />
}
