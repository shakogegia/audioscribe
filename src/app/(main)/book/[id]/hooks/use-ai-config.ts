import useAiStore from "../stores/ai";

export function useAiConfig() {
  const { transcriptionModel, aiProvider, aiModel } = useAiStore();

  const aiConfig = {
    transcriptionModel,
    aiProvider,
    aiModel,
  };

  return { aiConfig };
}
