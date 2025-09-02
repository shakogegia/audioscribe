
import { getAllLibraries } from "@/lib/audiobookshelf";
import { Search } from "./search";

export default  async function SearchPage() {
  const libraries = await getAllLibraries();
  return <Search libraries={libraries} />
}
