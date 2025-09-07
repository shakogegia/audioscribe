"use client"

import { Progress } from "@/components/ui/progress"
import { formatTime } from "@/lib/format"
import { type TranscriptProgress } from "@prisma/client"
import dayjs from "dayjs"
import { useEffect, useMemo } from "react"
import useSWR from "swr"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

export function TranscriptProgress({ bookId, onComplete }: { bookId: string; onComplete: () => void }) {
  const { data } = useSWR<{ progress: TranscriptProgress }>(`/api/book/${bookId}/transcribe/progress`, {
    refreshInterval: 5000,
  })

  useEffect(() => {
    if (data?.progress?.percentage === 100) {
      onComplete()
    }
  }, [data?.progress?.percentage, onComplete])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-4 w-full items-center">
        <div className="flex-1">
          <Progress value={100} className="animate-pulse" />
          <div className="text-sm text-muted-foreground mt-1">
            <div>Transcription in progress using {data?.progress?.model ?? "Unknown"} model...</div>
            <div>Started {dayjs(data?.progress?.startedAt ?? new Date()).fromNow()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
