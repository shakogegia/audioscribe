import { NextResponse } from "next/server"

const VOICES_JSON_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json"

// Cache the models for 24 hours
let cachedModels: TTSModel[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface TTSModel {
  id: string
  name: string
  description: string
  language: string
  quality: string
  files?: {
    onnx: string
    json: string
  }
}

interface PiperVoiceData {
  key: string
  name: string
  language: {
    code: string
    family: string
    region: string
    name_native: string
    name_english: string
  }
  quality: string
  num_speakers: number
  speaker_id_map?: Record<string, string>
  files: {
    [key: string]: {
      size_bytes: number
      md5_digest: string
    }
  }
}

interface VoicesJsonData {
  [key: string]: PiperVoiceData
}

export async function GET() {
  try {
    // Check cache first
    if (cachedModels && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedModels)
    }

    console.log("Fetching TTS models from HuggingFace...")

    const response = await fetch(VOICES_JSON_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch voices.json: ${response.statusText}`)
    }

    const data: VoicesJsonData = await response.json()

    // Parse and filter for English models
    const models: TTSModel[] = []

    for (const [key, voice] of Object.entries(data)) {
      // Only include English models (en_US and en_GB)
      if (!key.startsWith("en_US-") && !key.startsWith("en_GB-")) {
        continue
      }

      // Extract quality from key (e.g., "en_US-lessac-high" -> "high")
      const parts = key.split("-")
      const quality = parts[parts.length - 1]

      // Format speaker name
      let name = voice.name || parts.slice(1, -1).join(" ")
      name = name
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      // Add quality to name
      const qualityLabel = quality.charAt(0).toUpperCase() + quality.slice(1)
      const fullName = `${name} (${qualityLabel})`

      // Create description
      let description = `${voice.language.name_english} voice`
      if (voice.num_speakers > 1) {
        description += ` with ${voice.num_speakers} speaker variations`
      }

      models.push({
        id: key,
        name: fullName,
        description,
        language: voice.language.code,
        quality,
      })
    }

    // Sort models: high quality first, then medium, then low
    // Within each quality tier, sort alphabetically
    const qualityOrder = { high: 0, medium: 1, low: 2 }
    models.sort((a, b) => {
      const qualityDiff = qualityOrder[a.quality as keyof typeof qualityOrder] - qualityOrder[b.quality as keyof typeof qualityOrder]
      if (qualityDiff !== 0) return qualityDiff
      return a.name.localeCompare(b.name)
    })

    // Update cache
    cachedModels = models
    cacheTimestamp = Date.now()

    console.log(`Fetched ${models.length} English TTS models`)

    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching TTS models:", error)
    return NextResponse.json({ error: "Failed to fetch TTS models" }, { status: 500 })
  }
}
