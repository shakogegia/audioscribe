"use client"

import { AudioFile, SearchResult } from "@/types/api"
import ChatBotDemo from "./chatbot"
// import { useChat } from "@ai-sdk/react"
// import { DefaultChatTransport } from "ai"

interface ChatProps {
  bookId: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
}

export function Chat({ bookId, play }: ChatProps) {
  return (
    <div>
      <ChatBotDemo bookId={bookId} />
    </div>
  )
}
