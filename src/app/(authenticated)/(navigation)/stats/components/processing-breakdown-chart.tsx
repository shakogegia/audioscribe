"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { StatsData } from "../actions"

interface ProcessingBreakdownChartProps {
  data: StatsData["processingBreakdown"]
}

const chartConfig = {
  download: {
    label: "Download",
    color: "var(--chart-1)",
  },
  prepare: {
    label: "Prepare",
    color: "var(--chart-2)",
  },
  transcribe: {
    label: "Transcribe",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ProcessingBreakdownChart({ data }: ProcessingBreakdownChartProps) {
  if (data.length === 0) return null

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" unit="min" />
        <YAxis
          type="category"
          dataKey="bookTitle"
          width={150}
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="download"
          stackId="a"
          fill="var(--chart-1)"
          name="Download"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="prepare"
          stackId="a"
          fill="var(--chart-2)"
          name="Prepare"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="transcribe"
          stackId="a"
          fill="var(--chart-3)"
          name="Transcribe"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
