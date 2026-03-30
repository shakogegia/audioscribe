import { getSuggestions, updateSuggestions } from "@/actions/suggestions"
import Suggestions from "./suggestions"

export const dynamic = "force-dynamic"

export default async function SuggestionsPage() {
  const initialSuggestions = await getSuggestions()

  return <Suggestions initialSuggestions={initialSuggestions} updateSuggestions={updateSuggestions} />
}
