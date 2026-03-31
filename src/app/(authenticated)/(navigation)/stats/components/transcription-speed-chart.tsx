"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "../actions"
import { formatDuration } from "./format-duration"

export function TranscriptionSpeedChart({ data }: { data: StatsData["transcriptionSpeed"] }) {
  if (data.length === 0) return null

  const maxRtf = Math.max(...data.map(d => d.rtf))

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Transcription Speed</CardTitle>
        <CardDescription>Real-Time Factor (higher = faster)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map(entry => {
          const barWidth = maxRtf > 0 ? (entry.rtf / maxRtf) * 100 : 0

          return (
            <div key={entry.bookId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-[200px]">{entry.bookTitle}</span>
                <span className="text-muted-foreground text-xs font-mono tabular-nums">
                  {entry.rtf}x — {formatDuration(entry.audioDuration)} in {formatDuration(entry.processingTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--chart-1)] transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs font-medium font-mono tabular-nums w-10 text-right">{entry.rtf}x</span>
              </div>
              <div className="text-xs text-muted-foreground">{entry.model}</div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
