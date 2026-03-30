"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { StatsData } from "../actions"

interface ActivityChartProps {
  data: StatsData["activity"]
}

const chartConfig = {
  booksProcessed: {
    label: "Books",
    color: "var(--chart-1)",
  },
  audioHours: {
    label: "Audio Hours",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ActivityChart({ data }: ActivityChartProps) {
  if (data.length === 0) return null

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id="gradientBooks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="booksProcessed"
          stroke="var(--chart-1)"
          fill="url(#gradientBooks)"
          strokeWidth={2}
          name="Books"
        />
        <Area
          type="monotone"
          dataKey="audioHours"
          stroke="var(--chart-2)"
          fill="url(#gradientHours)"
          strokeWidth={2}
          name="Audio Hours"
        />
      </AreaChart>
    </ChartContainer>
  )
}
