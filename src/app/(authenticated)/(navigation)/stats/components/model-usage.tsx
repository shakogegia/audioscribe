"use client"

import { PieChart, Pie, Cell, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatsData } from "../actions"
import { formatDuration } from "./format-duration"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const chartConfig = {} satisfies ChartConfig

export function ModelUsage({ data }: { data: StatsData["modelUsage"] }) {
  if (data.length === 0) return null

  const pieData = data.map(m => ({
    name: m.model,
    value: m.bookCount,
  }))

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Model Distribution</CardTitle>
        <CardDescription>Usage, speed, and time estimates by transcription model</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="!aspect-square max-h-[160px]">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={70}
                strokeWidth={5}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(value: any) => [value, "Books"]} />
            </PieChart>
          </ChartContainer>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Books</TableHead>
                <TableHead className="text-right">Avg RTF</TableHead>
                <TableHead className="text-right">Median RTF</TableHead>
                <TableHead className="text-right">1h Audio</TableHead>
                <TableHead className="text-right">Avg Book</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.model}>
                  <TableCell className="font-medium">{row.model}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.bookCount}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.avgRtf}x</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.medianRtf}x</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatDuration(row.minutesPerAudioHour)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatDuration(row.estimatedAverageBookMinutes)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.totalHours}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
