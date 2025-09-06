import { generate, generateSystemPrompt, SystemPromptMessage } from "@/ai/helpers/generate"
import { AudiobookVectorDB, vectorDb } from "@/ai/lib/vector"
import { generateBookAnalysis } from "@/ai/prompts/book"
import { provider } from "@/ai/providers"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { AiModel, AiProvider } from "@/ai/types/ai"
import { getBook } from "@/lib/audiobookshelf"
import { NextRequest, NextResponse } from "next/server"

interface AiChatRequestBody {
  message: string
  transcriptions: { text: string }[]
  config: {
    transcriptionModel: WhisperModel
    aiProvider: AiProvider
    aiModel: AiModel
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: AiChatRequestBody = await request.json()

    const { transcriptions, message, config } = body

    const book = await getBook(bookId)
    const ai = await provider(config.aiProvider, config.aiModel)

    // Initialize vector DB for this book
    await vectorDb.initialize(bookId)

    // Search for relevant chunks
    const relevantChunks = await vectorDb.searchSimilar(message, 3)

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the transcript for your question.",
        timestamps: [],
      })
    }

    // const messages = buildSimpleContext(message, relevantChunks);
    const messages = buildContext(message, relevantChunks)
    // const response = await ollama.chat(messages);

    // const { analysis } = await generateBookAnalysis(ai, {
    //   message: message,
    //   transcriptions: transcriptions,
    //   context: {
    //     bookTitle: book?.title ?? "",
    //     authors: book?.authors ?? [],
    //   },
    // });

    const analysis = await generateSystemPrompt(ai, messages)

    return NextResponse.json({ analysis, messages, relevantChunks })
  } catch (error) {
    console.error("AI suggestion error:", error)

    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ error: "AI provider API key not configured or invalid" }, { status: 401 })
      }

      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json({ error: "AI provider quota exceeded. Please try again later." }, { status: 429 })
      }

      if (error.message.includes("network") || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Unable to reach AI provider. Please check your connection." },
          { status: 503 }
        )
      }
    }

    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}

function buildContext(userQuestion: string, relevantChunks: any[]): SystemPromptMessage[] {
  const systemPrompt = `
  You are an intelligent audiobook companion assistant.
  Analyze the provided transcript sections and answer questions about characters, plot points, and themes.
  Always include specific timestamps when referencing content.`

  let context = systemPrompt + "\n\nRelevant transcript sections:\n\n"

  relevantChunks.forEach(chunk => {
    context += `=== ${chunk.metadata.startTime} - ${chunk.metadata.endTime}  ===\n`
    context += chunk.text + "\n\n"
  })

  context +=
    "Instructions: Answer based only on the provided sections. Include specific timestamps when referencing content."

  return [
    { role: "system", content: context },
    { role: "user", content: userQuestion },
  ]
}

function buildSimpleContext(question: string, relevantChunks: any[]): SystemPromptMessage[] {
  let context = `Question: ${question}\n\nRelevant transcript sections:\n\n`

  relevantChunks.forEach(chunk => {
    context += `=== ${chunk.metadata.startTime} - ${chunk.metadata.endTime}  ===\n`
    context += `${chunk.text}\n\n`
  })

  context +=
    "Instructions: Answer based only on the provided sections. Include specific timestamps when referencing content."

  return [
    {
      role: "system",
      content:
        "You are an audiobook companion. Answer questions based only on the provided transcript sections. Include timestamps when referencing content.",
    },
    { role: "user", content: context },
  ]
}
