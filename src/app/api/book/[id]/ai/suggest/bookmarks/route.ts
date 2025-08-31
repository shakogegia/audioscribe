import { generateBookmarkSuggestions } from "@/ai/prompts/bookmark";
import { provider as googleProvider } from "@/ai/providers/google";
import { WhisperModel } from "@/ai/transcription/types/transription";
import { getBook } from "@/lib/audiobookshelf";
import { formatTime } from "@/lib/format";
import { NextRequest, NextResponse } from "next/server";

interface BookmarkSuggestionsRequestBody {
  transcription: string;
  offset?: number;
  config: {
    transcriptionModel: WhisperModel;
    aiProvider: string;
    aiModel: string;
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params;
    const body: BookmarkSuggestionsRequestBody = await request.json();

    const { transcription, offset = 15, config } = body;

    const book = await getBook(bookId);

    console.log("🚀 ~ POST ~ config:", config);
    const provider = await googleProvider(config.aiModel);

    const { suggestions } = await generateBookmarkSuggestions(provider, {
      transcription: transcription,
      context: {
        bookTitle: book?.title ?? "",
        authors: book?.authors ?? [],
        time: formatTime(Number(offset)),
      },
    });

    return NextResponse.json({ suggestions: suggestions });
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
