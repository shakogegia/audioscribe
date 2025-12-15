import { BookmarkIcon, UserIcon, BookOpenIcon, TimerIcon, MessageSquareQuoteIcon, MapIcon } from "lucide-react"
import useSWR from "swr"
import { ChatQuickQuestion } from "../../../../../../../../../generated/prisma"

export const useSuggestions = (): ChatQuickQuestion[] => {
  const { data: suggestions } = useSWR<ChatQuickQuestion[]>("/api/prompt-suggestions")
  return suggestions ?? []
}
