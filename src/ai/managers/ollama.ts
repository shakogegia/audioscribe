import { load } from "@/lib/config"
import axios from "axios"

export async function getModels() {
  const config = await load()
  const response = await axios.get<{ models: { name: string; model: string }[] }>(
    `${config.aiProviders.ollama.baseUrl}/api/tags`,
    {}
  )

  const models = response.data.models.map(model => ({ name: model.name, value: model.model }))

  return models
}
