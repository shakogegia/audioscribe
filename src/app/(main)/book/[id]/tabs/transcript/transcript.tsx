"use client"
import { Button } from "@/components/ui/button"
import { useTranscript } from "@/hooks/use-transcript"
import { formatTime } from "@/lib/format"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { TranscriptSegment } from "@prisma/client"
import { Captions, CaptionsOff, Scroll } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import TranscriptContent from "./transcript-content"

interface TranscriptProps {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

function findTranscriptSegment(transcriptSegments: TranscriptSegment[], time: number): TranscriptSegment | null {
  return transcriptSegments.find(segment => time >= segment.startTime && time < segment.endTime) ?? null
}

export function Transcript({ play }: TranscriptProps) {
  const { segments } = useTranscript()

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const currentTime = usePlayerStore(state => state.currentTime)
  const [followCurrentTime, setFollowCurrentTime] = useState(false)

  useEffect(() => {
    if (scrollAreaRef.current && followCurrentTime) {
      console.log("🚀 ~ Transcript ~ currentTime:", currentTime)
      const currentTimeInMilliseconds = currentTime * 1000
      const transcriptSegment = findTranscriptSegment(segments, currentTimeInMilliseconds)
      if (transcriptSegment) {
        scrollToTime(formatTime(transcriptSegment.startTime / 1000))
      }
    }
  }, [currentTime, segments, followCurrentTime]) // eslint-disable-line react-hooks/exhaustive-deps

  function scrollToTime(time: string) {
    if (scrollAreaRef.current) {
      const timeInMilliseconds =
        time
          .split(":")
          .reduce((acc, curr, index) => acc + parseInt(curr) * (index === 0 ? 3600 : index === 1 ? 60 : 1), 0) * 1000

      const transcriptSegment = findTranscriptSegment(segments, timeInMilliseconds)

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

      <TranscriptContent segments={segments} onTimeClick={onTimeClick} ref={scrollAreaRef} />
    </div>
  )
}
