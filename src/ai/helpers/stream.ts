import { convertToModelMessages, LanguageModel, streamText, StreamTextResult, ToolSet, type UIMessage } from "ai"

export async function stream(model: LanguageModel, messages: UIMessage[]): Promise<StreamTextResult<ToolSet, never>> {
  return streamText({
    model: model,
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
  })
}
