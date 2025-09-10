import { createPrompt } from "@/ai/helpers/prompt"

export interface ChatContext {
  title: string
  authors: string[]
  currentTime?: number
  duration: number
  chapters?: Array<{ title: string; start: number; end: number }>
  recentTranscript?: string
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
}

/**
 * Create system prompt for audiobook chat functionality
 */
export async function createAudiobookChatPrompt(context: ChatContext): Promise<string> {
  const { title, authors, currentTime, duration, recentTranscript, chapters, conversationHistory } = context
  const progress = currentTime && duration ? Math.round((currentTime / duration) * 100) : 0
  const currentTimeFormatted = currentTime ? formatTime(currentTime) : "beginning"
  const durationFormatted = formatTime(duration)

  // Find current chapter based on time
  const currentChapter = findCurrentChapter(chapters, currentTime || 0)

  // Summarize recent conversation if present
  const conversationSummary =
    conversationHistory && conversationHistory.length > 0 ? createConversationSummary(conversationHistory) : null

  return createPrompt("audiobook-chat", {
    title,
    authors,
    currentTimeFormatted,
    durationFormatted,
    progress,
    recentTranscript,
    currentChapter,
    conversationSummary,
  })
}

function findCurrentChapter(
  chapters: Array<{ title: string; start: number; end: number }> | undefined,
  currentTime: number
) {
  if (!chapters || chapters.length === 0) return null

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    if (currentTime >= chapter.start && currentTime < chapter.end) {
      return {
        title: chapter.title,
        index: i + 1,
        start: chapter.start,
        end: chapter.end,
      }
    }
  }

  // If not found, return the last chapter if we're past the end
  const lastChapter = chapters[chapters.length - 1]
  if (currentTime >= lastChapter.end) {
    return {
      title: lastChapter.title,
      index: chapters.length,
      start: lastChapter.start,
      end: lastChapter.end,
    }
  }

  return null
}

function createConversationSummary(history: Array<{ role: "user" | "assistant"; content: string }>): string {
  // Keep only recent conversation (last 3 exchanges)
  const recentHistory = history.slice(-6) // 3 user + 3 assistant messages

  if (recentHistory.length === 0) return ""

  const summary = recentHistory
    .map(msg => {
      const role = msg.role === "user" ? "User asked" : "You discussed"
      const content = msg.content?.length > 150 ? msg.content.substring(0, 150) + "..." : msg.content
      return `${role}: ${content}`
    })
    .join("\n")

  return summary
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
