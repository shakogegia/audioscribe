"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "../actions"
import { formatDuration } from "./format-duration"

const STAGE_COLORS = {
  download: "bg-[var(--chart-1)]",
  prepare: "bg-[var(--chart-2)]",
  transcribe: "bg-[var(--chart-3)]",
} as const

const STAGE_LABELS = {
  download: "Download",
  prepare: "Prepare",
  transcribe: "Transcribe",
} as const

export function ProcessingBreakdownChart({ data }: { data: StatsData["processingBreakdown"] }) {
  if (data.length === 0) return null

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Processing Time</CardTitle>
        <CardDescription>Time per stage (minutes)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map(book => {
          const total = book.download + book.prepare + book.transcribe
          if (total === 0) return null

          return (
            <div key={book.bookId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-[200px]">{book.bookTitle}</span>
                <span className="text-muted-foreground text-xs font-mono tabular-nums">{formatDuration(total)} total</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {(["download", "prepare", "transcribe"] as const).map(stage => {
                  const pct = (book[stage] / total) * 100
                  if (pct === 0) return null
                  return (
                    <div
                      key={stage}
                      className={`${STAGE_COLORS[stage]} h-full transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${STAGE_LABELS[stage]}: ${formatDuration(book[stage])}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          {(["download", "prepare", "transcribe"] as const).map(stage => (
            <div key={stage} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${STAGE_COLORS[stage]}`} />
              {STAGE_LABELS[stage]}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
