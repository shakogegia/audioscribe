import useSWR from "swr"
import { ChatQuickQuestion } from "@/generated/prisma"

export const useSuggestions = (): ChatQuickQuestion[] => {
  const { data: suggestions } = useSWR<ChatQuickQuestion[]>("/api/prompt-suggestions", {
    refreshInterval: 0,
  })
  return suggestions ?? []
}
