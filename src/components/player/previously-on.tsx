"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLLMModels } from "@/hooks/use-llm-models"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import axios from "axios"
import { HistoryIcon, Loader2, Volume2 } from "lucide-react"
import { useState } from "react"

export function PreviouslyOn({ book }: { book: SearchResult }) {
  const playerTime = usePlayerStore(state => state.currentTime)
  const { provider, model } = useLLMModels()
  const { speak, stop, isSpeaking, isGenerating: isTTSGenerating } = useTextToSpeech()
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  const handleClick = async () => {
    // If speaking, stop the speech
    if (isSpeaking) {
      stop()
      return
    }

    // Otherwise, generate and speak the summary
    setIsGeneratingSummary(true)
    try {
      const response = await axios.post(`/api/book/${book.id}/previously-on`, {
        currentTime: playerTime,
        config: { provider, model },
      })

      const { summary } = response.data

      // Automatically speak the summary with Piper TTS
      await speak(book.id, summary)
    } catch (error) {
      console.error("Failed to generate summary:", error)
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        console.error("Error:", error.response.data.error)
      }
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const getIcon = () => {
    if (isGeneratingSummary) {
      return <Loader2 className="w-5 h-5 animate-spin" />
    }
    if (isTTSGenerating) {
      return <Loader2 className="w-5 h-5 animate-spin" />
    }
    if (isSpeaking) {
      return <Volume2 className="w-5 h-5 animate-pulse" />
    }
    return <HistoryIcon className="w-5 h-5" />
  }

  const getTooltipText = () => {
    if (isGeneratingSummary) return "Generating summary..."
    if (isTTSGenerating) return "Generating audio..."
    if (isSpeaking) return "Speaking... (click to stop)"
    return `Previously on ${book.title}`
  }

  const isDisabled = isGeneratingSummary || isTTSGenerating

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="w-10" onClick={handleClick} disabled={isDisabled}>
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{getTooltipText()}</TooltipContent>
    </Tooltip>
  )
}
