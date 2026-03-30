import { AppConfig, load, save } from "@/lib/config"
import AudiobookshelfPage from "./audiobookshelf"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

async function updateConfig(config: AppConfig) {
  "use server"
  await save(config)
  revalidatePath("/", "layout")
}

export default async function AudiobookshelfSetupPage() {
  const config = await load()
  return <AudiobookshelfPage config={config} updateConfig={updateConfig} />
}
