import { transcribeAudioSegment } from "@/ai/transcription/transcription";
import { getAudioFileByTime } from "@/lib/helpers";
import { tempFolder } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params;
    const body = await request.json();

    const { startTime, duration = 30, offset = 15 } = body;

    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }

    const file = await getAudioFileByTime(bookId, startTime);

    // Transcribe the audio segment
    const transcription = await transcribeAudioSegment({
      provider: { type: "whisper", model: "medium.en" },
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
