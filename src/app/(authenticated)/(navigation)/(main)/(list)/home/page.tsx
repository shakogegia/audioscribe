import { getAllLibraries } from "@/lib/audiobookshelf"
import { Home } from "./home"

export default async function SearchPage() {
  const libraries = await getAllLibraries()
  return <Home libraries={libraries} />
}
