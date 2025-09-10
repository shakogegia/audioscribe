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

const models = [
  {
    name: "GPT 4o",
    value: "openai/gpt-4o",
  },
  {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
  },
]

const ChatBotDemo = () => {
  const [input, setInput] = useState("")
  const [model, setModel] = useState<string>(models[0].value)
  const { messages, sendMessage, status, regenerate } = useChat()

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text) return

    sendMessage({ text: message.text }, { body: { model: model } })
    setInput("")
  }

  function onSuggestionClick(suggestion: string) {
    sendMessage({ text: suggestion })
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
