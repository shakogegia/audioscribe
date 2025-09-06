"use client"

import { useAiConfig } from "@/hooks/use-ai-config"
import { findTranscriptLine } from "@/lib/caption"
import { SearchResult } from "@/types/api"
import axios from "axios"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { useMount } from "react-use"
import { toast } from "sonner"

interface CaptionsProps {
  book: SearchResult
  time: number
}

export interface BookPlayerRef {
  play: (time?: number) => void
}

export function Captions({ book, time }: CaptionsProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<string>("")
  const { aiConfig } = useAiConfig()

  const caption = transcript ? findTranscriptLine(transcript, time) : null

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" })
    try {
      setIsTranscribing(true)
      const response = await axios.post(`/api/book/${book.id}/transcribe/full`, {
        config: aiConfig,
      })
      setTranscript(response.data.transcript)
      toast.success("Transcribed full book", { id: "transcribe-full-book" })
    } catch (error) {
      console.error("Failed to transcribe full book:", error)
      toast.error("Failed to transcribe full book", { id: "transcribe-full-book" })
    } finally {
      setIsTranscribing(false)
    }
  }

  useMount(() => transcribeFullBook())

  return (
    <div className="flex items-center justify-center gap-1 -mt-4 mb-0.5">
      {isTranscribing && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Loader2Icon className="w-3 h-3 animate-spin" /> Transcribing...
        </div>
      )}
      {!isTranscribing && transcript && (
        <div className="text-sm text-muted-foreground min-h-5 flex items-center justify-between w-full font-sans">
          <span className="font-light text-right flex-1 truncate">{caption?.previousLine}</span>
          <span className="font-normal text-center flex-shrink-0 px-1">{caption?.line}</span>
          <span className="font-light text-left flex-1 truncate">{caption?.nextLine}</span>
        </div>
      )}
    </div>
  )
}
