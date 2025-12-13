"use client"
import { Button } from "@/components/ui/button"
import { useTranscript } from "@/hooks/use-transcript"
import { formatTime } from "@/lib/format"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { TranscriptSegment } from "../../../../../../../../../generated/prisma"
import { Captions, CaptionsOff, Scroll } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import TranscriptContent from "./transcript-content"

interface TranscriptProps {
  bookId: string
  book: SearchResult
  play?: (time?: number) => void
}

const mergeDuration = 10 * 1000 // 40 seconds in milliseconds

function findTranscriptSegment(transcriptSegments: TranscriptSegment[], time: number): TranscriptSegment | null {
  return transcriptSegments.find(segment => time >= segment.startTime && time < segment.endTime) ?? null
}

export function Transcript({ play }: TranscriptProps) {
  const { segments } = useTranscript()

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const currentTime = usePlayerStore(state => state.currentTime)
  const [followCurrentTime, setFollowCurrentTime] = useState(false)

  const mergedSegments = useMemo<TranscriptSegment[]>(() => {
    // Sort segments by start time to ensure proper order
    const sortedSegments: TranscriptSegment[] = [...segments].sort((a, b) => a.startTime - b.startTime)

    // Merge segments within mergeDuration windows
    const mergedSegments: TranscriptSegment[] = []

    let currentGroup: TranscriptSegment[] = []
    let groupStartTime = 0

    for (const segment of sortedSegments) {
      // If this is the first segment, always add it
      if (currentGroup.length === 0) {
        groupStartTime = segment.startTime
        currentGroup.push(segment)
      } else {
        // Check if adding this segment would exceed the merge duration
        const wouldExceedDuration = segment.startTime - groupStartTime > mergeDuration

        if (wouldExceedDuration) {
          // Process the current group and start a new one
          const mergedText = currentGroup.map(s => s.text).join(" ")
          const groupEndTime = currentGroup[currentGroup.length - 1].endTime

          mergedSegments.push({
            id: 0,
            bookId: "",
            fileIno: "",
            model: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            startTime: groupStartTime,
            endTime: groupEndTime,
            text: mergedText,
          })

          // Start new group with current segment
          currentGroup = [segment]
          groupStartTime = segment.startTime
        } else {
          // Add to current group - keep building the natural text flow
          currentGroup.push(segment)
        }
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      const mergedText = currentGroup.map(s => s.text).join(" ")
      const groupEndTime = currentGroup[currentGroup.length - 1].endTime

      mergedSegments.push({
        id: 0,
        bookId: "",
        fileIno: "",
        model: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        startTime: groupStartTime,
        endTime: groupEndTime,
        text: mergedText,
      })
    }

    return mergedSegments
  }, [segments])

  useEffect(() => {
    if (scrollAreaRef.current && followCurrentTime) {
      const currentTimeInMilliseconds = currentTime * 1000
      const transcriptSegment = findTranscriptSegment(mergedSegments, currentTimeInMilliseconds)
      if (transcriptSegment) {
        scrollToTime(formatTime(transcriptSegment.startTime / 1000))
      }
    }
  }, [currentTime, mergedSegments, followCurrentTime]) // eslint-disable-line react-hooks/exhaustive-deps

  function scrollToTime(time: string) {
    if (scrollAreaRef.current) {
      const timeInMilliseconds =
        time
          .split(":")
          .reduce((acc, curr, index) => acc + parseInt(curr) * (index === 0 ? 3600 : index === 1 ? 60 : 1), 0) * 1000

      const transcriptSegment = findTranscriptSegment(mergedSegments, timeInMilliseconds)

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
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant={followCurrentTime ? "secondary" : "outline"}
          onClick={() => setFollowCurrentTime(!followCurrentTime)}
          size="sm"
        >
          {followCurrentTime ? <CaptionsOff className="w-4 h-4" /> : <Captions className="w-4 h-4" />}
          {followCurrentTime ? "Stop Following Player" : "Follow Player"}
        </Button>

        <Button
          variant="outline"
          onClick={() => scrollToTime(formatTime(currentTime))}
          disabled={followCurrentTime}
          size="sm"
        >
          <Scroll className="w-4 h-4" />
          Scroll to Current Time
        </Button>
      </div>

      <TranscriptContent segments={mergedSegments} onTimeClick={onTimeClick} ref={scrollAreaRef} />
    </div>
  )
}
