"use client"
import { usePlayerStore } from "@/stores/player"
import { useTranscriptStore } from "@/stores/transcript"
import { secondsToMilliseconds } from "@/utils/time"
import axios from "axios"
import { useCallback, useState } from "react"
import { TranscriptSegment } from "../../generated/prisma"

interface Response {
  isLoading: boolean
  segments: TranscriptSegment[]

  fetchTranscript: (bookId: string) => Promise<void>
  findCaption: (seconds: number) => Caption
  findMergedCaption: (seconds: number) => Caption
}

type Caption = {
  current?: TranscriptSegment
  previous?: TranscriptSegment
  prev2?: TranscriptSegment // Additional lookbehind for smooth transitions
  next?: TranscriptSegment
  next2?: TranscriptSegment // Additional lookahead for smooth transitions
}

export function useTranscript(): Response {
  const currentTime = usePlayerStore(state => state.currentTime)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const segments = useTranscriptStore(state => state.segments)
  const setSegments = useTranscriptStore(state => state.setSegments)

  const [mergedSegments, setMergedSegments] = useState<TranscriptSegment[]>([])

  const fetchTranscript = useCallback(
    async (bookId: string) => {
      try {
        setIsLoading(true)
        const response = await axios.get<{ segments: TranscriptSegment[] }>(`/api/book/${bookId}/transcript`)
        setSegments(response.data.segments)
        const merged = getGergeSegments(response.data.segments, 5 * 1000)
        setMergedSegments(merged)
      } catch (error) {
        console.error("Failed to fetch transcriptions:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [setSegments, setMergedSegments]
  )

  function findCaption(seconds: number): Caption {
    const milliseconds = secondsToMilliseconds(seconds)
    const index =
      segments.findIndex(segment => milliseconds >= segment.startTime && milliseconds < segment.endTime) ?? null

    const caption: Caption = {
      current: undefined,
      previous: undefined,
      prev2: undefined,
      next: undefined,
      next2: undefined,
    }

    if (index === -1) {
      return caption
    }

    caption.current = segments[index]
    caption.previous = segments[index - 1]
    caption.prev2 = segments[index - 2] // Additional lookbehind for smooth transitions
    caption.next = segments[index + 1]
    caption.next2 = segments[index + 2] // Additional lookahead for smooth transitions

    return caption
  }

  function findMergedCaption(): Caption {
    const milliseconds = currentTime * 1000

    const index = mergedSegments.findIndex(
      segment => milliseconds >= segment.startTime && milliseconds < segment.endTime
    )
    const caption: Caption = {
      current: undefined,
      previous: undefined,
      prev2: undefined,
      next: undefined,
      next2: undefined,
    }

    if (index === -1) {
      return caption
    }

    caption.current = mergedSegments[index]
    caption.previous = mergedSegments[index - 1]
    caption.prev2 = mergedSegments[index - 2]
    caption.next = mergedSegments[index + 1]
    caption.next2 = mergedSegments[index + 2]

    return caption
  }

  return {
    isLoading,
    segments,
    fetchTranscript,
    findCaption,
    findMergedCaption,
  }
}

function getGergeSegments(segments: TranscriptSegment[], mergeDuration: number): TranscriptSegment[] {
  // Sort segments by start time to ensure proper order
  const sortedSegments: TranscriptSegment[] = [...segments].sort((a, b) => a.startTime - b.startTime)

  // Merge segments within mergeDuration windows
  const mergedSegments: TranscriptSegment[] = []

  let currentGroup: TranscriptSegment[] = []
  let groupStartTime = 0

  let id = 0

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
          id: ++id,
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
      id: ++id,
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
}
