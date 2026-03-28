"use client"

import { Action, Actions } from "@/components/ai-elements/actions"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation"
import { Loader } from "@/components/ai-elements/loader"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Response } from "@/components/ai-elements/response"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { ChatContextDialog } from "@/components/dialogs/chat-context-dialog"
import { Button } from "@/components/ui/button"
import { SelectGroup, SelectLabel } from "@/components/ui/select"
import { useLLMModels } from "@/hooks/use-llm-models"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { useChat } from "@ai-sdk/react"
import { CaptionsIcon, CopyIcon, Loader2Icon, RefreshCcwIcon, Volume2Icon, StopCircleIcon } from "lucide-react"
import { Fragment, useRef, useState } from "react"
import { useSuggestions } from "./suggestions"
import { ChatQuickQuestion } from "../../../../../../../../../generated/prisma"

type ChatBotDemoProps = {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

type RequestBody = {
  model: string
  provider: string
  bookId: string
  time?: number
  custom?: { time: number; before: number; after: number } | null
}

const ChatBotDemo = ({ bookId, book }: ChatBotDemoProps) => {
  const suggestions = useSuggestions()

  const [input, setInput] = useState("")
  const { messages, sendMessage, status, regenerate } = useChat()
  const currentTime = usePlayerStore(state => state.currentTime)
  const { models, model, setModel, isLoading: isLoadingModels, provider } = useLLMModels()

  const [context, setContext] = useState<{ time: number; before: number; after: number } | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoadingTTS, setIsLoadingTTS] = useState(false)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)

  async function speak(text: string) {
    if (isSpeaking) {
      ttsAudioRef.current?.pause()
      ttsAudioRef.current = null
      setIsSpeaking(false)
      return
    }

    setIsLoadingTTS(true)
    try {
      // Strip markdown syntax for clean TTS output
      const plainText = text
        .replace(/#{1,6}\s+/g, "")        // headings
        .replace(/\*\*(.+?)\*\*/g, "$1")  // bold
        .replace(/\*(.+?)\*/g, "$1")      // italic
        .replace(/__(.+?)__/g, "$1")       // bold alt
        .replace(/_(.+?)_/g, "$1")         // italic alt
        .replace(/~~(.+?)~~/g, "$1")       // strikethrough
        .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline/block code
        .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
        .replace(/^[-*+]\s+/gm, "")        // unordered list markers
        .replace(/^\d+\.\s+/gm, "")        // ordered list markers
        .replace(/^>\s+/gm, "")            // blockquotes
        .replace(/---+/g, "")              // horizontal rules
        .replace(/\n{2,}/g, ". ")          // paragraph breaks to pauses
        .replace(/\n/g, " ")              // remaining newlines
        .trim()

      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText, model: "en_US-hfc_female-medium" }),
      })

      if (!response.ok) throw new Error("TTS failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      ttsAudioRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        ttsAudioRef.current = null
      }

      setIsSpeaking(true)
      await audio.play()
    } catch {
      setIsSpeaking(false)
    } finally {
      setIsLoadingTTS(false)
    }
  }
  function handleSubmit(message: PromptInputMessage) {
    if (!message.text || !model || !provider) return

    const requestBody: RequestBody = { model: model, provider, bookId, time: currentTime }

    requestBody.time = currentTime
    requestBody.custom = context

    sendMessage({ text: message.text }, { body: requestBody })
    setInput("")
  }

  function onSuggestionClick(suggestion: string) {
    if (!model || !provider) return
    const requestBody: RequestBody = { model: model, provider, bookId, time: currentTime, custom: context }
    sendMessage({ text: suggestion }, { body: requestBody })
  }

  function applyContext({ time, before, after }: { time: number; before: number; after: number }) {
    setContext({ time, before, after })
  }

  return (
    <div className="max-w-4xl mx-auto relative size-full h-screen border rounded-xl max-h-[500px] p-2">
      <div className="flex flex-col h-full">
        {/* Conversation */}
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map(message => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.filter(part => part.type === "source-url").length > 0 && (
                    <Sources>
                      <SourcesTrigger count={message.parts.filter(part => part.type === "source-url").length} />
                      {message.parts
                        .filter(part => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent variant="flat">
                              <Response>{part.text}</Response>
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" && i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action onClick={() => regenerate()} label="Retry">
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action onClick={() => navigator.clipboard.writeText(part.text)} label="Copy">
                                <CopyIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() => speak(part.text)}
                                label={isLoadingTTS ? "Loading..." : isSpeaking ? "Stop" : "Speak"}
                              >
                                {isLoadingTTS ? (
                                  <Loader2Icon className="size-3 animate-spin" />
                                ) : isSpeaking ? (
                                  <StopCircleIcon className="size-3" />
                                ) : (
                                  <Volume2Icon className="size-3" />
                                )}
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      )
                    default:
                      return null
                  }
                })}
              </div>
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Suggestions */}
        <Suggestions className="mt-4">
          {suggestions.map(suggestion => (
            <Suggestion
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.question)}
              suggestion={suggestion.question}
              className="font-normal"
            >
              {suggestion.question}
            </Suggestion>
          ))}
        </Suggestions>

        {/* Prompt Input */}
        <PromptInput onSubmit={handleSubmit} className="mt-2 " globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>{attachment => <PromptInputAttachment data={attachment} />}</PromptInputAttachments>
            <PromptInputTextarea className="md:text-sm" onChange={e => setInput(e.target.value)} value={input} />
          </PromptInputBody>

          <PromptInputToolbar>
            <div className="flex items-center gap-2">
              <PromptInputTools>
                <PromptInputModelSelect onValueChange={value => setModel(value)} value={model}>
                  <PromptInputModelSelectTrigger>
                    {isLoadingModels ? (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <PromptInputModelSelectValue />
                    )}
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map(provider => (
                      <SelectGroup key={provider.provider}>
                        <SelectLabel>{provider.provider}</SelectLabel>
                        {provider.models.map(model => (
                          <PromptInputModelSelectItem key={model.value} value={model.value}>
                            {model.name}
                          </PromptInputModelSelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>

              <ChatContextDialog book={book} onApply={applyContext}>
                <div>
                  <Button variant="ghost" className="text-muted-foreground" size="sm">
                    <CaptionsIcon className="size-4" />
                    Context
                  </Button>
                </div>
              </ChatContextDialog>
            </div>

            {/* Submit */}
            <PromptInputSubmit disabled={!input && !status} status={status} variant="secondary" />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

export default ChatBotDemo
