import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface LLMState {
  provider: string
  model: string
  setProvider: (provider: string) => void
  setModel: (model: string) => void
}

const useLLMStore = create<LLMState>()(
  devtools(
    persist(
      set => ({
        provider: "google",
        model: "gemini-2.5-pro",
        setProvider: (provider: string) => set({ provider }),
        setModel: (model: string) => set({ model }),
      }),
      {
        name: "llm-storage",
      }
    )
  )
)

export default useLLMStore
