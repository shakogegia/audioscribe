"use client"

import GradientIcon from "@/components/gradient-icon"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MicIcon, Volume2, Loader2, AlertCircle, StopCircle, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTTSModels } from "@/hooks/use-tts-models"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const DEFAULT_SAMPLE_TEXT =
  "Previously on Lord of the Rings: The fellowship stood at the edge of darkness, their quest hanging by a thread. With courage in their hearts and hope as their guide, they ventured forth into the unknown, knowing that even the smallest person can change the course of the future."

const PIPER_PROJECT_URL = "https://github.com/OHF-Voice/piper1-gpl"
const PIPER_VOICES_URL = "https://huggingface.co/rhasspy/piper-voices"

const selectedModel = "en_US-hfc_female-medium"

export default function TTSListPage() {
  const { models, loading, error } = useTTSModels()
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE_TEXT)
  const [loadingModel, setLoadingModel] = useState<string | null>(null)
  const [playingModel, setPlayingModel] = useState<string | null>(null)
  const [playedModels, setPlayedModels] = useState<Set<string>>(new Set())
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setPlayingModel(null)
    }
  }

  function copyModelId(modelId: string) {
    navigator.clipboard.writeText(modelId)
    toast.success("Model ID copied to clipboard")
  }

  async function previewModel(modelId: string) {
    // If this model is currently playing, stop it
    if (playingModel === modelId) {
      stopAudio()
      return
    }

    if (!sampleText.trim()) {
      toast.error("Please enter some text to preview")
      return
    }

    // Stop any currently playing audio
    stopAudio()

    // Clear previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    setLoadingModel(modelId)

    try {
      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sampleText,
          model: modelId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate audio")
      }

      // Get the audio blob from the response
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      // Create and play audio
      const audio = new Audio(url)

      // Set up event listeners
      audio.onended = () => {
        setPlayingModel(null)
      }

      audio.onerror = () => {
        setPlayingModel(null)
        toast.error("Failed to play audio")
      }

      setCurrentAudio(audio)
      setPlayingModel(modelId)
      setPlayedModels(prev => new Set(prev).add(modelId))
      await audio.play()

      toast.success("Playing audio preview")
    } catch (error) {
      console.error("Preview error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate audio preview")
      setPlayingModel(null)
    } finally {
      setLoadingModel(null)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4 mb-10">
      <Hero
        title="Text-to-Speech Models"
        description={[
          "Preview and test different TTS voices for your audiobook narration.",
          "Powered by Piper - a fast, local neural text-to-speech system.",
        ]}
        icon={<GradientIcon icon={<MicIcon className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About Piper TTS</CardTitle>
            <CardDescription>
              Using{" "}
              <a
                href={PIPER_PROJECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Piper
              </a>{" "}
              for high-quality neural text-to-speech. Voice models are sourced from{" "}
              <a
                href={PIPER_VOICES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                HuggingFace
              </a>{" "}
              and downloaded automatically on first use.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Text</CardTitle>
            <CardDescription>Enter text to preview how each voice sounds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="sample-text">Text to synthesize</Label>
              <Textarea
                id="sample-text"
                placeholder="Enter sample text here..."
                value={sampleText}
                onChange={e => setSampleText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Available Voice Models {!loading && models.length > 0 && `(${models.length})`}
          </h3>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-muted-foreground">Loading voice models from HuggingFace...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            models.map(model => {
              const hasBeenPlayed = playedModels.has(model.id)
              const isSelected = model.id === selectedModel
              return (
                <div
                  key={model.id}
                  className={`flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors ${
                    hasBeenPlayed ? "bg-muted" : ""
                  } ${isSelected ? "border-primary border-2" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{model.name}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Selected
                        </Badge>
                      )}
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        {model.id}
                      </Badge>
                      <button
                        onClick={() => copyModelId(model.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy model ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{model.description}</p>
                  </div>
                  <Button
                    onClick={() => previewModel(model.id)}
                    disabled={loadingModel !== null && loadingModel !== model.id}
                    variant={
                      playingModel === model.id ? "destructive" : loadingModel === model.id ? "secondary" : "default"
                    }
                    size="sm"
                    className="shrink-0"
                  >
                    {loadingModel === model.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : playingModel === model.id ? (
                      <>
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
