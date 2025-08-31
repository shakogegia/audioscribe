export type AiProvider = "ollama" | "google";
export type AiModel = OllamaModel | GeminiModel;

export type OllamaModel = "llama3.2:3b" | "mistral:7b" | "llama2:13b";

export type GeminiModel =
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-latest"
  | "gemini-1.5-flash-001"
  | "gemini-1.5-flash-002"
  | "gemini-1.5-flash-8b"
  | "gemini-1.5-flash-8b-latest"
  | "gemini-1.5-flash-8b-001"
  | "gemini-1.5-pro"
  | "gemini-1.5-pro-latest"
  | "gemini-1.5-pro-001"
  | "gemini-1.5-pro-002"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-001"
  | "gemini-2.0-flash-live-001"
  | "gemini-2.0-flash-lite"
  | "gemini-2.0-pro-exp-02-05"
  | "gemini-2.0-flash-thinking-exp-01-21"
  | "gemini-2.0-flash-exp"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-image-preview"
  | "gemini-2.5-pro-exp-03-25"
  | "gemini-2.5-flash-preview-04-17"
  | "gemini-exp-1206"
  | "gemma-3-12b-it"
  | "gemma-3-27b-it";
