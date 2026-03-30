"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "../actions"

const chartConfig = {
  download: { label: "Download", color: "var(--chart-1)" },
  prepare: { label: "Prepare", color: "var(--chart-2)" },
  transcribe: { label: "Transcribe", color: "var(--chart-3)" },
} satisfies ChartConfig

export function ProcessingBreakdownChart({ data }: { data: StatsData["processingBreakdown"] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Time Breakdown</CardTitle>
        <CardDescription>Time spent per stage (minutes)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={v => `${v}m`} />
            <YAxis type="category" dataKey="bookTitle" width={150} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="download" stackId="a" fill="var(--color-download)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="prepare" stackId="a" fill="var(--color-prepare)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="transcribe" stackId="a" fill="var(--color-transcribe)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
