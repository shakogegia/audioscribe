import { useCallback, useEffect, useMemo } from "react"
import { useLocalStorage } from "react-use"
import useSWR from "swr"

type ResponseType = {
  provider: string
  models: { name: string; value: string }[]
}[]

const DEFAULT_MODEL = "gemini-2.5-pro"
const DEFAULT_PROVIDER = "google"

export function useLLMModels() {
  const [model, setModelState] = useLocalStorage("selected-model", DEFAULT_MODEL)
  const [provider, setProviderState] = useLocalStorage("selected-provider", DEFAULT_PROVIDER)

  const { data, isLoading, error } = useSWR<ResponseType>("/api/llm", {
    revalidateOnFocus: false,
    refreshInterval: 1000 * 60 * 60, // 1 hour
    revalidateOnMount: true,
  })

  const modelList = useMemo(() => data?.flatMap(provider => provider.models) ?? [], [data])

  const setModel = useCallback(
    function setModel(model: string) {
      const provider = data?.find(provider => provider.models.some(x => x.value === model))?.provider
      if (provider) {
        setProviderState(provider)
      }
      setModelState(model)
    },
    [data, setProviderState, setModelState]
  )

  const setProvider = useCallback(
    function setProvider(provider: string) {
      setProviderState(provider)
      const _model = data?.find(x => x.provider === provider)?.models.find(x => x.value === model)
      if (!_model) {
        setModelState(data?.find(x => x.provider === provider)?.models[0].value ?? DEFAULT_MODEL)
      }
    },
    [setProviderState, model, data, setModelState]
  )

  useEffect(() => {
    if (data) {
      const _model = modelList.find(x => x.value === model)
      if (!_model) {
        setModel(modelList[0].value)
      }
    }
  }, [model, data, setModel, modelList])

  return {
    models: data || [],
    model,
    setModel,
    provider,
    setProvider,
    isLoading,
    error,
  }
}
