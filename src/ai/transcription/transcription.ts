import { extractAudioSegment } from "./audio/extract";
import { TranscriptionRequest, TranscriptionResult } from "@/ai/transcription/types/transription";
import { transcribe as transcribeWithWhisper } from "@/ai/transcription/whisper/transcribe";
import { preprocessAudio } from "./audio/process";

/**
 * Extract audio segment from audiobook and transcribe it using local Whisper
 */
export async function transcribeAudioSegment(request: TranscriptionRequest): Promise<TranscriptionResult> {
  try {
    // Extract audio segment around the bookmark
    const rawAudioBuffer = await extractAudioSegment(
      request.audioUrl,
      request.startTime,
      request.duration,
      request.offset
    );

    // Preprocess audio for better transcription quality
    const processedAudioBuffer = await preprocessAudio(rawAudioBuffer);

    if (request.provider.type === "whisper") {
      // Transcribe using local Whisper
      const transcription = await transcribeWithWhisper(processedAudioBuffer, request.provider.model);
      return transcription;
    } else {
      throw new Error("Unsupported transcription provider");
    }
  } catch (error) {
    console.error("Error transcribing audio segment:", error);
    throw new Error("Failed to transcribe audio segment");
  }
}
