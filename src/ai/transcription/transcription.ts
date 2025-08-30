import { extractAudioSegment } from "./audio/extract";
import { TranscriptionRequest, TranscriptionResult } from "@/ai/transcription/types/transription";
import { transcribe as transcribeWithWhisper } from "@/ai/transcription/whisper/transcribe";
import { preprocessAudio } from "./audio/process";
import { getCachedTranscription, cacheTranscription } from "@/ai/transcription/cache/cache";

/**
 * Extract audio segment from audiobook and transcribe it using local Whisper
 */
export async function transcribeAudioSegment(request: TranscriptionRequest): Promise<TranscriptionResult> {
  try {
    // Check if we have a cached transcription first
    const cachedResult = await getCachedTranscription(request);
    if (cachedResult) {
      return cachedResult;
    }

    // Extract audio segment around the bookmark
    const rawAudioBuffer = await extractAudioSegment(
      request.audioUrl,
      request.startTime,
      request.duration,
      request.offset
    );

    // Preprocess audio for better transcription quality
    const processedAudioBuffer = await preprocessAudio(rawAudioBuffer);

    let transcription: TranscriptionResult;

    if (request.provider.type === "whisper") {
      // Transcribe using local Whisper
      transcription = await transcribeWithWhisper(processedAudioBuffer, request.provider.model);
    } else {
      throw new Error("Unsupported transcription provider");
    }

    // Cache the transcription result for future use
    if (transcription.text) {
      await cacheTranscription(request, transcription);
    }

    return transcription;
  } catch (error) {
    console.error("Error transcribing audio segment:", error);
    throw new Error("Failed to transcribe audio segment");
  }
}
