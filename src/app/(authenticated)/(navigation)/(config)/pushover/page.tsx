import { load } from "@/lib/config"
import Pushover from "./pushover"

export default async function PushoverPage() {
  const config = await load()

  return <Pushover config={config} />
}
