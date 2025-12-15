import { getSuggestions, updateSuggestions } from "@/actions/suggestions"
import Suggestions from "./suggestions"

export default async function SuggestionsPage() {
  const initialSuggestions = await getSuggestions()

  return <Suggestions initialSuggestions={initialSuggestions} updateSuggestions={updateSuggestions} />
}
