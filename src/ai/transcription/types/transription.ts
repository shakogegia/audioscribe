export type WhisperModel =
  | "tiny"
  | "tiny.en"
  | "base"
  | "base.en"
  | "small"
  | "small.en"
  | "medium"
  | "medium.en"
  | "large-v1"
  | "large"
  | "large-v3-turbo";

export type WhisperProvider = { type: "whisper"; model: WhisperModel };

export type ASRProvider = WhisperProvider;

export interface TranscriptionRequest {
  provider: ASRProvider;
  audioUrl: string;
  startTime: number;
  duration: number; // Duration in seconds to transcribe around the bookmark
  offset: number; // Offset in seconds to start transcribing from
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}
