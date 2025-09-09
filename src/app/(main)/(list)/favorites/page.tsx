import { getAllLibraries } from "@/lib/audiobookshelf"
import { Favorites } from "./favorites"

export default async function SearchPage() {
  const libraries = await getAllLibraries()

  return <Favorites libraries={libraries} />
}
