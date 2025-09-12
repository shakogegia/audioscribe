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
import { CaptionsIcon, CopyIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react"
import { Fragment, useState } from "react"
import { suggestionIcons, suggestions } from "./suggestions"

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
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, regenerate } = useChat()
  const currentTime = usePlayerStore(state => state.currentTime)
  const { models, model, setModel, isLoading: isLoadingModels, provider } = useLLMModels()

  const [context, setContext] = useState<{ time: number; before: number; after: number } | null>(null)

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
          {suggestions.map((suggestion, index) => (
            <Suggestion key={suggestion} onClick={onSuggestionClick} suggestion={suggestion} className="font-normal">
              {suggestionIcons[index]}
              {suggestion}
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
