import { transcribeFullAudioFile } from "@/ai/transcription/transcription";
import { WhisperModel } from "@/ai/transcription/types/transription";
import { getBookFiles } from "@/lib/audiobookshelf";
import { tempFolder } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface TranscribeRequestBody {
  config: {
    transcriptionModel: WhisperModel;
    aiProvider: string;
    aiModel: string;
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params;
    const body: TranscribeRequestBody = await request.json();

    const { config } = body;

    const files = await getBookFiles(bookId);

    // async for each file
    const transcriptions = await Promise.all(
      files.map(file => {
        return transcribeFullAudioFile({
          provider: { type: "whisper", model: config.transcriptionModel },
          audioUrl: path.join(tempFolder, file.path),
        });
      })
    );

    return NextResponse.json({ transcriptions });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 });
  }
}
