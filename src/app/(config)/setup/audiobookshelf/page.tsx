"use server"
import { AppConfig, load, save } from "@/lib/config"
import AudiobookshelfPage from "./audiobookshelf"
import { revalidatePath } from "next/cache"

// Move updateConfig to a server action and export it
export async function updateConfig(config: AppConfig) {
  "use server"
  await save(config)
  revalidatePath("/", "layout")
}

export default async function AudiobookshelfSetupPage() {
  const config = await load()

  // Pass the server action reference to the client component
  return <AudiobookshelfPage config={config} updateConfig={updateConfig} />
}
