import { load } from "@/lib/config"
import axios from "axios"

type ApiResponseType = {
  models: {
    name: string
    version: string
    displayName: string
    description: string
    inputTokenLimit: number
    outputTokenLimit: number
    supportedGenerationMethods: string[]
    temperature: number
    topP: number
    topK: number
    maxTemperature: number
  }[]
}

// TODO: check if this is correct
const SUPPORTED_GENERATION_METHODS = ["generateContent", "countTokens", "createCachedContent", "batchGenerateContent"]

export async function getModels() {
  const config = await load()
  const response = await axios.get<ApiResponseType>("https://generativelanguage.googleapis.com/v1beta/models", {
    params: { key: config?.aiProviders.google.apiKey },
  })

  const models = response.data.models
    .filter(model => SUPPORTED_GENERATION_METHODS.every(method => model.supportedGenerationMethods.includes(method)))
    .map(model => ({ name: model.displayName, value: model.name }))

  return models
}
