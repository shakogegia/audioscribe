"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { StatsData } from "../actions"
import { formatDuration } from "./format-duration"

const breakdownConfig = {
  download: { label: "Download", color: "var(--chart-1)" },
  prepare: { label: "Prepare", color: "var(--chart-2)" },
  transcribe: { label: "Transcribe", color: "var(--chart-3)" },
} satisfies ChartConfig

const speedConfig = {
  rtf: { label: "RTF", color: "var(--chart-1)" },
} satisfies ChartConfig

type ActiveChart = "breakdown" | "speed"

export function PerformanceChart({
  breakdown,
  speed,
}: {
  breakdown: StatsData["processingBreakdown"]
  speed: StatsData["transcriptionSpeed"]
}) {
  const [activeChart, setActiveChart] = React.useState<ActiveChart>("breakdown")

  if (breakdown.length === 0 && speed.length === 0) return null

  const sortedBreakdown = React.useMemo(
    () => [...breakdown].sort((a, b) => (b.download + b.prepare + b.transcribe) - (a.download + a.prepare + a.transcribe)),
    [breakdown]
  )

  const sortedSpeed = React.useMemo(() => [...speed].sort((a, b) => b.rtf - a.rtf), [speed])

  const totalProcessingMinutes = breakdown.reduce((sum, b) => sum + b.download + b.prepare + b.transcribe, 0)

  const medianRtf = React.useMemo(() => {
    if (speed.length === 0) return 0
    const sorted = [...speed].map(s => s.rtf).sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }, [speed])

  return (
    <Card className="flex-1 py-0 gap-0">
      <div className="flex flex-col items-stretch border-b sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            {activeChart === "breakdown" ? "Processing time per stage" : "Real-Time Factor (higher = faster)"}
          </CardDescription>
        </div>
        <div className="flex">
          {(
            [
              { key: "breakdown", label: "Total Time", value: formatDuration(totalProcessingMinutes) },
              { key: "speed", label: "Median RTF", value: `${medianRtf}x` },
            ] as const
          ).map(item => (
            <button
              key={item.key}
              data-active={activeChart === item.key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6 sm:py-3"
              onClick={() => setActiveChart(item.key)}
            >
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-lg font-bold leading-none sm:text-3xl whitespace-nowrap">{item.value}</span>
            </button>
          ))}
        </div>
      </div>
      <CardContent className="px-2 sm:p-6">
        {activeChart === "breakdown" ? (
          <ChartContainer config={breakdownConfig} className="!aspect-auto w-full" style={{ height: 250 }}>
            <BarChart data={sortedBreakdown} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bookTitle"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => (value.length > 12 ? value.slice(0, 12) + "..." : value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-44"
                    labelFormatter={value => String(value)}
                    formatter={(value, name) => {
                      const config = breakdownConfig[name as keyof typeof breakdownConfig]
                      return (
                        <div className="flex w-full items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: config?.color }}
                          />
                          <span className="text-muted-foreground">{config?.label}</span>
                          <span className="ml-auto font-mono font-medium tabular-nums">
                            {formatDuration(value as number)}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Bar dataKey="download" stackId="a" fill="var(--color-download)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="prepare" stackId="a" fill="var(--color-prepare)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="transcribe" stackId="a" fill="var(--color-transcribe)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={speedConfig} className="!aspect-auto w-full" style={{ height: 250 }}>
            <BarChart data={sortedSpeed} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bookTitle"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => (value.length > 12 ? value.slice(0, 12) + "..." : value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-44"
                    labelFormatter={value => String(value)}
                    formatter={(value, name, item) => {
                      const entry = item.payload as StatsData["transcriptionSpeed"][number]
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex w-full items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: "var(--chart-1)" }}
                            />
                            <span className="text-muted-foreground">RTF</span>
                            <span className="ml-auto font-mono font-medium tabular-nums">{entry.rtf}x</span>
                          </div>
                          <div className="text-xs text-muted-foreground pl-[18px]">
                            {formatDuration(entry.audioDuration)} in {formatDuration(entry.processingTime)} &middot;{" "}
                            {entry.model}
                          </div>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Bar dataKey="rtf" fill="var(--color-rtf)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
