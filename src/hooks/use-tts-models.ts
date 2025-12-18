import { useEffect, useState } from "react"
import { TTSModel } from "@/app/api/tts/models/route"

export function useTTSModels() {
  const [models, setModels] = useState<TTSModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/tts/models")

        if (!response.ok) {
          throw new Error("Failed to fetch TTS models")
        }

        const data = await response.json()
        setModels(data)
      } catch (err) {
        console.error("Error fetching TTS models:", err)
        setError(err instanceof Error ? err.message : "Failed to load models")
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  return { models, loading, error }
}
