import { load } from "@/lib/config"
import Pushover from "./pushover"

export const dynamic = "force-dynamic"

export default async function PushoverPage() {
  const config = await load()

  return <Pushover config={config} />
}
