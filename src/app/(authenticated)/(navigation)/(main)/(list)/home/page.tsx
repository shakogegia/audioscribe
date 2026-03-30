import { getAllLibraries } from "@/lib/audiobookshelf"
import { Home } from "./home"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const libraries = await getAllLibraries()
  return <Home libraries={libraries} />
}
