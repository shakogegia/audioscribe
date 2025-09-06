import type { WhisperModel } from "@/ai/transcription/types/transription"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface AiState {
  transcriptionModel: WhisperModel
  aiProvider: string
  aiModel: string
  setTranscriptionModel: (transcriptionModel: WhisperModel) => void
  setAiProvider: (aiProvider: string) => void
  setAiModel: (aiModel: string) => void
}

const useAiStore = create<AiState>()(
  devtools(
    persist(
      set => ({
        transcriptionModel: "large-v3-turbo",
        aiProvider: "google",
        aiModel: "gemini-2.5-pro",
        setTranscriptionModel: (transcriptionModel: WhisperModel) => set({ transcriptionModel }),
        setAiProvider: (aiProvider: string) => set({ aiProvider }),
        setAiModel: (aiModel: string) => set({ aiModel }),
      }),
      {
        name: "ai-storage",
      }
    )
  )
)

export default useAiStore
