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
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Response } from "@/components/ai-elements/response"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { useChat } from "@ai-sdk/react"
import { CopyIcon, RefreshCcwIcon } from "lucide-react"
import { Fragment, useState } from "react"
import { suggestionIcons, suggestions } from "./suggestions"
import { llmModels } from "@/utils/constants"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"

const models = llmModels.flatMap(provider => provider.models.map(model => ({ name: model, value: model })))
const defaultModel = "gemini-2.5-pro"

// Parse time stamps from user messages (e.g., "at 15:30", "around 1:23:45", "at 2:30:15")
function parseTimeFromMessage(message: string): number | null {
  // Match patterns like "at 15:30", "around 1:23:45", etc.
  const timeRegex = /(?:at|around|about)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/i
  const match = message.match(timeRegex)

  if (match) {
    const hours = parseInt(match[1], 10) || 0
    const minutes = parseInt(match[2], 10) || 0
    const seconds = parseInt(match[3], 10) || 0

    // Convert to total seconds
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

type RequestBody = {
  model: string
  bookId: string
  time?: number
}

type ChatBotDemoProps = {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

const ChatBotDemo = ({ bookId }: ChatBotDemoProps) => {
  const [input, setInput] = useState("")
  const [model, setModel] = useState<string>(defaultModel)
  const { messages, sendMessage, status, regenerate } = useChat()
  const currentTime = usePlayerStore(state => state.currentTime)

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text) return

    // Parse time from message if present (e.g., "at 15:30", "around 1:23:45")
    const parsedTime = parseTimeFromMessage(message.text)
    const requestBody: RequestBody = { model: model, bookId, time: currentTime }

    if (parsedTime !== null) {
      requestBody.time = parsedTime
    }

    requestBody.time = currentTime

    sendMessage({ text: message.text }, { body: requestBody })
    setInput("")
  }

  function onSuggestionClick(suggestion: string) {
    const requestBody: RequestBody = { model: model, bookId, time: currentTime }
    sendMessage({ text: suggestion }, { body: requestBody })
  }

  return (
    <div className="max-w-4xl mx-auto relative size-full h-screen border rounded-xl max-h-[500px] p-2">
      <div className="flex flex-col h-full">
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
                            </Actions>
                          )}
                        </Fragment>
                      )
                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === "streaming" &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
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

        <Suggestions className="mt-4">
          {suggestions.map((suggestion, index) => (
            <Suggestion key={suggestion} onClick={onSuggestionClick} suggestion={suggestion} className="font-normal">
              {suggestionIcons[index]}
              {suggestion}
            </Suggestion>
          ))}
        </Suggestions>

        <PromptInput onSubmit={handleSubmit} className="mt-2 " globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>{attachment => <PromptInputAttachment data={attachment} />}</PromptInputAttachments>
            <PromptInputTextarea className="md:text-sm" onChange={e => setInput(e.target.value)} value={input} />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              {/* <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu> */}
              <PromptInputModelSelect onValueChange={value => setModel(value)} value={model}>
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map(model => (
                    <PromptInputModelSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} variant="secondary" />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

export default ChatBotDemo
