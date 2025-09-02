
import { load } from "@/lib/config";
import { Search } from "./search";

export default  async function SearchPage() {
  const config = await load();
  return <Search config={config} />
}
