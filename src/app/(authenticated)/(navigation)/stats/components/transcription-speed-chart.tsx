"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "../actions"

const chartConfig = {
  rtf: { label: "RTF", color: "var(--chart-1)" },
} satisfies ChartConfig

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: StatsData["transcriptionSpeed"][number] }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm space-y-1">
      <p className="font-medium truncate max-w-[200px]">{d.bookTitle}</p>
      <p className="text-muted-foreground">
        RTF: <span className="text-foreground font-medium">{d.rtf}x</span>
      </p>
      <p className="text-muted-foreground">
        Audio: <span className="text-foreground">{d.audioDuration} min</span>
      </p>
      <p className="text-muted-foreground">
        Processing: <span className="text-foreground">{d.processingTime} min</span>
      </p>
      <p className="text-muted-foreground">
        Model: <span className="text-foreground">{d.model}</span>
      </p>
    </div>
  )
}

export function TranscriptionSpeedChart({ data }: { data: StatsData["transcriptionSpeed"] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription Speed</CardTitle>
        <CardDescription>
          Real-Time Factor — higher is faster (e.g. 5x = 1h audio in 12min)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={v => `${v}x`} />
            <YAxis type="category" dataKey="bookTitle" width={150} tick={{ fontSize: 12 }} />
            <ReferenceLine x={1} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rtf" fill="var(--color-rtf)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
