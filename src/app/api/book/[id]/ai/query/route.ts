import { generateBookAnalysis } from "@/ai/prompts/book";
import { provider } from "@/ai/providers";
import { WhisperModel } from "@/ai/transcription/types/transription";
import { AiModel, AiProvider } from "@/ai/types/ai";
import { getBook } from "@/lib/audiobookshelf";
import { NextRequest, NextResponse } from "next/server";

interface AiChatRequestBody {
  message: string;
  transcriptions: { text: string }[];
  config: {
    transcriptionModel: WhisperModel;
    aiProvider: AiProvider;
    aiModel: AiModel;
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params;
    const body: AiChatRequestBody = await request.json();

    return NextResponse.json({ analysis: "test at 00:12:34 asnd asnd asnd" });

    const { transcriptions, message, config } = body;

    const book = await getBook(bookId);

    const ai = await provider(config.aiProvider, config.aiModel);

    const { analysis } = await generateBookAnalysis(ai, {
      message: message,
      transcriptions: transcriptions,
      context: {
        bookTitle: book?.title ?? "",
        authors: book?.authors ?? [],
      },
    });

    return NextResponse.json({ analysis: analysis });
  } catch (error) {
    console.error("AI suggestion error:", error);

    // Provide helpful error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ error: "AI provider API key not configured or invalid" }, { status: 401 });
      }

      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json({ error: "AI provider quota exceeded. Please try again later." }, { status: 429 });
      }

      if (error.message.includes("network") || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Unable to reach AI provider. Please check your connection." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to generate bookmark suggestions" }, { status: 500 });
  }
}
