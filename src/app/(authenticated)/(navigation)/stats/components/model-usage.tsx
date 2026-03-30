"use client"

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StatsData } from "../actions"

interface ModelUsageProps {
  data: StatsData["modelUsage"]
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const chartConfig = {} satisfies ChartConfig

export function ModelUsage({ data }: ModelUsageProps) {
  if (data.length === 0) return null

  const pieData = data.map(m => ({
    name: m.model,
    value: m.bookCount,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value, "Books"]}
          />
        </PieChart>
      </ChartContainer>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Books</TableHead>
            <TableHead className="text-right">Avg RTF</TableHead>
            <TableHead className="text-right">Median RTF</TableHead>
            <TableHead className="text-right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.model}>
              <TableCell className="font-medium">{row.model}</TableCell>
              <TableCell className="text-right">{row.bookCount}</TableCell>
              <TableCell className="text-right">{row.avgRtf}x</TableCell>
              <TableCell className="text-right">{row.medianRtf}x</TableCell>
              <TableCell className="text-right">{row.totalHours}h</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
