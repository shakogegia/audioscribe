"use client"
import { useTranscriptStore } from "@/stores/transcript"
import { secondsToMilliseconds } from "@/utils/time"
import { TranscriptSegment } from "@prisma/client"
import axios from "axios"
import { useState } from "react"

interface Response {
  isLoading: boolean
  segments: TranscriptSegment[]

  fetchTranscript: (bookId: string) => Promise<void>
  findCaption: (seconds: number) => Caption
}

type Caption = {
  current?: TranscriptSegment
  previous?: TranscriptSegment
  next?: TranscriptSegment
}

export function useTranscript(): Response {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const segments = useTranscriptStore(state => state.segments)
  const setSegments = useTranscriptStore(state => state.setSegments)

  async function fetchTranscript(bookId: string) {
    try {
      setIsLoading(true)
      const response = await axios.get<{ segments: TranscriptSegment[] }>(`/api/book/${bookId}/transcript`)
      setSegments(response.data.segments)
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function findCaption(seconds: number): Caption {
    const milliseconds = secondsToMilliseconds(seconds)
    const index =
      segments.findIndex(segment => milliseconds >= segment.startTime && milliseconds < segment.endTime) ?? null

    const caption: Caption = {
      current: undefined,
      previous: undefined,
      next: undefined,
    }

    if (index === -1) {
      return caption
    }

    caption.current = segments[index]
    caption.previous = segments[index - 1]
    caption.next = segments[index + 1]

    return caption
  }

  return {
    isLoading,
    segments,
    fetchTranscript,
    findCaption,
  }
}
