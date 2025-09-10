import { convertToModelMessages, LanguageModel, streamText, StreamTextResult, ToolSet, type UIMessage } from "ai"
import { createAudiobookChatPrompt, type ChatContext } from "@/ai/prompts/chat"

export async function stream(
  model: LanguageModel, 
  messages: UIMessage[], 
  bookContext: ChatContext
): Promise<StreamTextResult<ToolSet, never>> {
  const systemPrompt = await createAudiobookChatPrompt(bookContext)

  return streamText({
    model: model,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
  })
}
