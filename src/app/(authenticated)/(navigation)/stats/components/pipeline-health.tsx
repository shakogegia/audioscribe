"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { StatsData } from "../actions"

interface PipelineHealthProps {
  data: StatsData["pipelineHealth"]
}

const chartConfig = {
  rate: {
    label: "Failure Rate %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function PipelineHealth({ data }: PipelineHealthProps) {
  const hasFailures = data.failureRates.some(f => f.failed > 0)
  const hasRetries = data.retryDistribution.length > 0
  const hasErrors = data.recentErrors.length > 0

  if (!hasFailures && !hasRetries && !hasErrors) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">
            All systems nominal — no failures or retries detected.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Failure rate chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Failure Rates by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart
                data={data.failureRates}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, _name: string, props: { payload?: { total?: number; failed?: number } }) => {
                    const { total = 0, failed = 0 } = props.payload ?? {}
                    return [`${value.toFixed(1)}% (${failed}/${total})`, "Failure Rate"]
                  }}
                />
                <Bar dataKey="rate" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Retry distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Retry Distribution</CardTitle>
            <CardDescription>Jobs that required more than one attempt</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRetries ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.retryDistribution.map(row => (
                    <TableRow key={row.attempts}>
                      <TableCell>{row.attempts}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No retries recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent errors table */}
      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentErrors.map((err, i) => (
                  <TableRow key={`${err.bookId}-${i}`}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {err.bookTitle}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{err.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                      {err.error}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(err.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
