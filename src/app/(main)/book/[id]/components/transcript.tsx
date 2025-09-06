"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAiConfig } from "@/hooks/use-ai-config"
import { formatTime } from "@/lib/format"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { TranscriptSegment } from "@prisma/client"
import axios from "axios"
import { Captions, CaptionsOff, Loader2Icon, Scroll, Terminal } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import TranscriptContent from "../tabs/transcript/transcript-content"

interface TranscriptProps {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

function findTranscriptSegment(transcriptSegments: TranscriptSegment[], time: number): TranscriptSegment | null {
  return transcriptSegments.find(segment => time >= segment.startTime && time < segment.endTime) ?? null
}

export function Transcript({ bookId, play }: TranscriptProps) {
  const { aiConfig } = useAiConfig()
  const [isTranscribing, setIsTranscribing] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const currentTime = usePlayerStore(state => state.currentTime)
  const [followCurrentTime, setFollowCurrentTime] = useState(false)

  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([])

  useEffect(() => {
    if (scrollAreaRef.current && transcriptSegments.length > 0 && followCurrentTime) {
      const currentTimeInMilliseconds = currentTime * 1000
      const transcriptSegment = findTranscriptSegment(transcriptSegments, currentTimeInMilliseconds)
      if (transcriptSegment) {
        scrollToTime(formatTime(transcriptSegment.startTime / 1000))
      }
    }
  }, [currentTime, transcriptSegments, followCurrentTime])

  function scrollToTime(time: string) {
    if (scrollAreaRef.current && transcriptSegments.length > 0) {
      const timeInMilliseconds =
        time
          .split(":")
          .reduce((acc, curr, index) => acc + parseInt(curr) * (index === 0 ? 3600 : index === 1 ? 60 : 1), 0) * 1000

      const transcriptSegment = findTranscriptSegment(transcriptSegments, timeInMilliseconds)

      if (transcriptSegment) {
        const activeLines = scrollAreaRef.current.querySelectorAll("p.active-line")
        activeLines.forEach(line => {
          line.classList.remove("active-line")
        })

        const lineP = scrollAreaRef.current.querySelector(`p[data-milliseconds="${transcriptSegment.startTime}"]`)
        if (lineP) {
          lineP.scrollIntoView({ behavior: "smooth", block: "center" })
          lineP.classList.add("active-line")
        }
      }

      // const transcriptSegment = transcriptSegments.find(segment => segment.startTime === time)
      // const timeSpan = scrollAreaRef.current.querySelector(`span[data-time="${time}"]`)
    }
  }

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" })
    try {
      setIsTranscribing(true)
      const response = await axios.post(`/api/book/${bookId}/transcribe/full`, {
        config: aiConfig,
      })
      setTranscriptSegments(response.data.transcript)
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

      {transcriptSegments.length === 0 && (
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

      {transcriptSegments.length > 0 && !isTranscribing && (
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

      {!isTranscribing && transcriptSegments.length > 0 && (
        <TranscriptContent transcriptSegments={transcriptSegments} onTimeClick={onTimeClick} ref={scrollAreaRef} />
      )}
    </div>
  )
}
