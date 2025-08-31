import { extractAudioSegment } from "./audio/extract";
import { ASRProvider, TranscriptionRequest, TranscriptionResult } from "@/ai/transcription/types/transription";
import { transcribe as transcribeWithWhisper } from "@/ai/transcription/whisper/transcribe";
import { preprocessAudio } from "./audio/process";
import { getCachedTranscription, cacheTranscription } from "@/ai/transcription/cache/cache";
import { convertToWavBuffer } from "./audio/buffer";

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

/**
 * Transcribe full audiobook
 */
export async function transcribeFullAudioFile(request: {
  provider: ASRProvider;
  audioUrl: string;
}): Promise<{ text: string }> {
  try {
    const cachedRequest: TranscriptionRequest = {
      provider: request.provider,
      audioUrl: request.audioUrl,
      startTime: 0,
      duration: Infinity,
      offset: 0,
    };

    // // Check if we have a cached transcription first
    const cachedResult = await getCachedTranscription(cachedRequest);
    if (cachedResult) {
      return cachedResult;
    }

    const rawAudioBuffer = await convertToWavBuffer(request.audioUrl);

    // // Preprocess audio for better transcription quality
    const processedAudioBuffer = await preprocessAudio(rawAudioBuffer);

    let transcription: TranscriptionResult;

    if (request.provider.type === "whisper") {
      // Transcribe using local Whisper
      transcription = await transcribeWithWhisper(processedAudioBuffer, request.provider.model);
    } else {
      throw new Error("Unsupported transcription provider");
    }

    // // Cache the transcription result for future use
    if (transcription.text) {
      await cacheTranscription(cachedRequest, transcription);
    }

    return transcription;
  } catch (error) {
    console.error("Error transcribing full audio file:", error);
    throw new Error("Failed to transcribe full audio file");
  }
}
