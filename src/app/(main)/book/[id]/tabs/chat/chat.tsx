"use client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { Markdown } from "@/components/markdown"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Textarea } from "@/components/ui/textarea"
import { useAiConfig } from "@/hooks/use-ai-config"
import { AudioFile, SearchResult } from "@/types/api"
import axios from "axios"
import { Fullscreen, Lightbulb, Loader2Icon, ScanSearch, Scroll, Send, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Toggle } from "@/components/ui/toggle"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

interface ChatProps {
  bookId: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
}

export function Chat({ bookId, play }: ChatProps) {
  const { aiConfig } = useAiConfig()
  const [isGenerating, setIsGenerating] = useState(false)
  const [contextType, setContextType] = useState<"contextual" | "full">("contextual")
  const [input, setInput] = useState("")

  const { messages, sendMessage: sendMessageStream } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/book/${bookId}/ai/chat/stream`,
    }),
  })

  const [message, setMessage] = useState("")
  const [analysis, setAnalysis] = useState("")

  async function sendMessage() {
    try {
      setAnalysis("")
      setIsGenerating(true)
      const response = await axios.post(`/api/book/${bookId}/ai/chat`, {
        message,
        config: aiConfig,
      })
      setAnalysis(response.data.analysis)
      setIsGenerating(false)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message", { id: "send-message" })
    } finally {
      setIsGenerating(false)
    }
  }

  function onTimeClick(time: string) {
    const timeToSeconds = time.split(".")[0].split(":")
    const hours = parseInt(timeToSeconds[0])
    const minutes = parseInt(timeToSeconds[1])
    const seconds = parseInt(timeToSeconds[2])
    const timeInSeconds = hours * 3600 + minutes * 60 + seconds
    play?.(timeInSeconds)
  }

  return (
    <div>
      <div className="sm:max-w-2xl flex flex-col gap-4">
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label>Analysis</Label>
            <div>
              {!analysis && !isGenerating && (
                <>
                  <p className="text-sm">
                    Ask a question to the AI to get a detailed analysis of the book.
                    {/* <span className="animate-pulse"> ▍</span> */}
                    <span
                      className="text-neutral-600 dark:text-neutral-400"
                      style={{ animation: "pulse .7s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
                    >
                      {" "}
                      ▍
                    </span>
                  </p>
                </>
              )}

              {isGenerating && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Generating analysis...
                </div>
              )}
              {!isGenerating && analysis && (
                <Markdown className="max-h-[300px] overflow-y-auto" text={analysis} onTimeClick={onTimeClick} />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Message</Label>
          <Textarea
            placeholder="Ask your question here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isGenerating}
            required
            name="message"
          />
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="default" onClick={sendMessage} type="submit" disabled={isGenerating || !message}>
            {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </Button>

          <div className="flex items-center gap-2">
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger>
                <Toggle
                  variant="outline"
                  size="sm"
                  value="contextual"
                  aria-label="Toggle smart search mode"
                  pressed={contextType === "contextual"}
                  onPressedChange={() => setContextType("contextual")}
                >
                  <ScanSearch />
                  Smart Search
                </Toggle>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">Find the most relevant parts of the book for your question.</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p className="text-xs">
                    <strong>How it works:</strong> Analyzes your question and finds the 3 most relevant 2-minute
                    sections from the book using vector embeddings and semantic similarity.
                  </p>
                  <ul className="text-xs space-y-0.5">
                    <li>
                      • <strong>Fast:</strong> Quick response (2-5 seconds)
                    </li>
                    <li>
                      • <strong>Efficient:</strong> Only sends relevant content to AI
                    </li>
                    <li>
                      • <strong>Cost-effective:</strong> Minimal token usage
                    </li>
                    <li>
                      • <strong>Accurate:</strong> Focuses on most relevant content
                    </li>
                  </ul>
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger>
                <Toggle
                  variant="outline"
                  size="sm"
                  value="full"
                  aria-label="Toggle full transcript"
                  pressed={contextType === "full"}
                  onPressedChange={() => setContextType("full")}
                >
                  <Scroll />
                  Entire Book
                </Toggle>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">Use the full transcript of the book to answer the question.</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-2">
                  <p className="font-medium text-amber-600">
                    <TriangleAlert className="w-4 h-4 inline-block -mt-0.5" /> Warning - Full Context Mode:
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • <strong>High Cost:</strong> Sends entire book transcript to AI (can be 100K+ tokens)
                    </li>
                    <li>
                      • <strong>Slow Response:</strong> Processing time increases significantly (30s-2min+)
                    </li>
                    <li>
                      • <strong>Token Limits:</strong> May exceed model context limits for very long books
                    </li>
                    <li>
                      • <strong>API Quotas:</strong> Could quickly exhaust paid provider limits
                    </li>
                    <li>
                      • <strong>Privacy:</strong> Entire book content sent to external AI service
                    </li>
                  </ul>
                  <p className="text-xs text-blue-600">
                    <Lightbulb className="w-4 h-4 inline-block -mt-0.5" /> <strong>Recommendation:</strong> Use
                    &quot;Smart Search&quot; mode for most questions - it&apos;s faster, cheaper, and often more
                    accurate. it&apos;s faster, cheaper, and often more accurate.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        {/* Stream */}
        {/* <div className="flex flex-col items-center gap-2 w-full border rounded-md p-2">
          <input
            className="w-full border"
            value={input}
            onChange={event => {
              setInput(event.target.value)
            }}
            onKeyDown={async event => {
              if (event.key === "Enter") {
                sendMessageStream({
                  parts: [{ type: "text", text: input }],
                })
              }
            }}
          />

          {messages.map((message, index) => (
            <div key={index}>
              {message.parts.map(part => {
                if (part.type === "text") {
                  // return <div key={`${message.id}-text`}>{part.text}</div>
                  return <Markdown text={part.text} key={`${message.id}-text`} />
                }
              })}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  )
}
