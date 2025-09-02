import { type AppConfig } from "@/lib/config";
import { create } from "zustand";

interface LLMState {
  config: AppConfig;
  update: (config: AppConfig) => void;
}

const useLLMStore = create<LLMState>(set => ({
  config: {
    audiobookshelf: { url: null, apiKey: null },
    aiProviders: {
      openai: { enabled: false, apiKey: null },
      google: { enabled: false, apiKey: null },
      anthropic: { enabled: false, apiKey: null },
      ollama: { enabled: false, baseUrl: null },
    },
  },
  update: (config: AppConfig) =>
    set(state => ({
      config: { ...state.config, ...config },
    })),
}));

export default useLLMStore;
