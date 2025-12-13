import { getAllLibraries } from "@/lib/audiobookshelf"
import { Home } from "./home"
import { load } from "@/lib/config"
import { redirect } from "next/navigation"

export default async function SearchPage() {
  const config = await load()

  const isAudiobookshelfConfigured = Object.values(config.audiobookshelf).every(value => Boolean(value))
  if (!isAudiobookshelfConfigured) {
    return redirect("/setup/audiobookshelf")
  }

  const aiProviders = Object.values(config.aiProviders).filter(provider => provider.enabled)
  if (aiProviders.length === 0) {
    return redirect("/setup/llm")
  }
  const libraries = await getAllLibraries()
  return <Home libraries={libraries} />
}
