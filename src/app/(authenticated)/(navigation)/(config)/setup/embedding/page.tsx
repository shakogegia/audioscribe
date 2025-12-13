"use server"
import { AppConfig, load, save } from "@/lib/config"
import EmbeddingPage from "./embedding"
import { revalidatePath } from "next/cache"

// Move updateConfig to a server action and export it
async function updateConfig(config: AppConfig) {
  "use server"
  await save(config)
  // Revalidate the page to clear any cached config
  revalidatePath("/", "layout")
}

export default async function EmbeddingSetupPage() {
  const config = await load()

  // Pass the server action reference to the client component
  return <EmbeddingPage config={config} updateConfig={updateConfig} />
}
