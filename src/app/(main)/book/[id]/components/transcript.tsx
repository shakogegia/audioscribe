"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAiConfig } from "@/hooks/use-ai-config"
import { findTranscriptLine } from "@/lib/caption"
import { formatTime } from "@/lib/format"
import { useBookPlayerStore } from "@/stores/book-player"
import { SearchResult } from "@/types/api"
import axios from "axios"
import { Captions, CaptionsOff, Loader2Icon, Scroll, Terminal } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import TranscriptContent from "./text"

interface TranscriptProps {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

export function Transcript({ bookId, play }: TranscriptProps) {
  const { aiConfig } = useAiConfig()
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const currentTime = useBookPlayerStore(state => state.currentTime)
  const [followCurrentTime, setFollowCurrentTime] = useState(false)

  useEffect(() => {
    if (scrollAreaRef.current && transcript && followCurrentTime) {
      const { time } = findTranscriptLine(transcript, currentTime) ?? {}
      if (time) {
        scrollToTime(formatTime(time ?? 0))
      }
    }
  }, [currentTime, transcript, followCurrentTime])

  function scrollToTime(time: string) {
    if (scrollAreaRef.current) {
      const timeSpan = scrollAreaRef.current.querySelector(`span[data-time="${time}"]`)
      const activeSpans = scrollAreaRef.current.querySelectorAll("span.active-time")
      activeSpans.forEach(span => {
        span.classList.remove("active-time")
      })
      if (timeSpan) {
        timeSpan.scrollIntoView({ behavior: "smooth", block: "center" })
        timeSpan.classList.add("active-time")
      }
    }
  }

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" })
    try {
      setIsTranscribing(true)
      const response = await axios.post(`/api/book/${bookId}/transcribe/full`, {
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

  const onTimeClick = useCallback(
    (time: string) => {
      const timeToSeconds = time.split(":")
      const hours = parseInt(timeToSeconds[0])
      const minutes = parseInt(timeToSeconds[1])
      const seconds = parseInt(timeToSeconds[2])
      const timeInSeconds = hours * 3600 + minutes * 60 + seconds
      play?.(timeInSeconds)
    },
    [play]
  )

  return (
    <div className="flex flex-col gap-4 mt-2 mb-6">
      {isTranscribing && (
        <Alert variant="default">
          <Terminal />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Don`t close this tab or navigate away from this page until the transcription is complete.
          </AlertDescription>
        </Alert>
      )}

      {!transcript && (
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          onClick={transcribeFullBook}
          disabled={isTranscribing}
        >
          {isTranscribing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Captions className="w-4 h-4" />}
          Transcribe Full Book
        </Button>
      )}

      {transcript && !isTranscribing && (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFollowCurrentTime(!followCurrentTime)}>
            {followCurrentTime ? <CaptionsOff className="w-4 h-4" /> : <Captions className="w-4 h-4" />}
            {followCurrentTime ? "Stop Following Player" : "Follow Player"}
          </Button>

          <Button variant="outline" onClick={() => scrollToTime(formatTime(currentTime))} disabled={followCurrentTime}>
            <Scroll className="w-4 h-4" />
            Scroll to Current Time
          </Button>
        </div>
      )}

      {!isTranscribing && transcript && (
        <TranscriptContent text={transcript} onTimeClick={onTimeClick} ref={scrollAreaRef} />
      )}
    </div>
  )
}
