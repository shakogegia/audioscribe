"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { StatsData } from "../actions"

interface TranscriptionSpeedChartProps {
  data: StatsData["transcriptionSpeed"]
}

const chartConfig = {
  rtf: {
    label: "RTF",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface TooltipPayloadEntry {
  payload: StatsData["transcriptionSpeed"][number]
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
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

export function TranscriptionSpeedChart({ data }: TranscriptionSpeedChartProps) {
  if (data.length === 0) return null

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="bookTitle"
          width={150}
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <ReferenceLine x={1} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: "1x", position: "insideTopRight", fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="rtf" fill="var(--chart-1)" name="RTF" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
