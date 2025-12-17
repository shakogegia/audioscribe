import { getPrompts } from "@/actions/prompts"
import Prompts from "./prompts"

export default async function PromptsPage() {
  const prompts = await getPrompts()
  return <Prompts prompts={prompts} />
}
