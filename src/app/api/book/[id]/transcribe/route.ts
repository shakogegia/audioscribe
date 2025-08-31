import { transcribeAudioSegment } from "@/ai/transcription/transcription";
import { WhisperModel } from "@/ai/transcription/types/transription";
import { getAudioFileByTime } from "@/lib/helpers";
import { tempFolder } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface TranscribeRequestBody {
  startTime: number;
  duration?: number;
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
    const body: TranscribeRequestBody = await request.json();

    const { startTime, duration = 30, offset = 15, config } = body;

    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }

    const file = await getAudioFileByTime(bookId, startTime);

    // Transcribe the audio segment
    const transcription = await transcribeAudioSegment({
      provider: { type: "whisper", model: config.transcriptionModel },
      audioUrl: path.join(tempFolder, file.path),
      startTime: startTime - file.start,
      duration,
      offset,
    });

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio segment" }, { status: 500 });
  }
}
