import { getPrompts } from "@/actions/prompts"
import Prompts from "./prompts"

export const dynamic = "force-dynamic"

export default async function PromptsPage() {
  const prompts = await getPrompts()
  return <Prompts prompts={prompts} />
}
