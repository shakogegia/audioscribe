"use client"

import GradientIcon from "@/components/gradient-icon"
import { Hero } from "@/components/hero"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Cog } from "lucide-react"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useMemo, useState, useEffect, useCallback } from "react"

dayjs.extend(relativeTime)

interface Job {
  id: string
  type: string
  status: string
  attempts: number
  maxAttempts: number
  createdAt: string
  completedAt?: string
  failedAt?: string
  error?: string
}

interface QueueStats {
  pending: number
  running: number
  completed: number
  failed: number
  total: number
}

const badgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  running: "secondary",
  failed: "destructive",
  pending: "outline",
  total: "default",
}

const refreshInterval = 2000

export default function JobsListPage() {
  const [currentTime, setCurrentTime] = useState(new Date())

  const { data: jobs = [], isLoading: jobsLoading } = useSWR<Job[]>("/api/jobs", {
    refreshInterval,
  })

  const { data: stats = { pending: 0, running: 0, completed: 0, failed: 0, total: 0 }, isLoading: statsLoading } =
    useSWR<QueueStats>("/api/jobs?stats=true", {
      refreshInterval,
    })

  const loading = jobsLoading || statsLoading

  // Update current time every second to ensure runTime calculations are fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    return dayjs(dateString).fromNow()
  }

  const statConfigs = [
    { key: "total", label: "Total", color: "" },
    { key: "pending", label: "Pending", color: "text-yellow-600" },
    { key: "running", label: "Running", color: "text-blue-600" },
    { key: "completed", label: "Completed", color: "text-green-600" },
    { key: "failed", label: "Failed", color: "text-red-600" },
  ]

  const calculateRunTime = useCallback(
    (job: Job) => {
      function formatTime(seconds: number) {
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(seconds / 3600)
        if (seconds < 60) {
          return seconds + "s"
        }
        if (seconds < 3600) {
          return minutes + "m " + (seconds % 60) + "s"
        }
        return hours + "h " + (minutes % 60) + "m " + (seconds % 60) + "s"
      }

      if (job.status === "running") {
        return formatTime(dayjs(currentTime).diff(dayjs(job.createdAt), "seconds"))
      }
      if (job.completedAt) {
        return formatTime(dayjs(job.completedAt).diff(dayjs(job.createdAt), "seconds"))
      }
      if (job.failedAt) {
        return formatTime(dayjs(job.failedAt).diff(dayjs(job.createdAt), "seconds"))
      }
      return "-"
    },
    [currentTime]
  )

  const jobsWithRunTime = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      runTime: calculateRunTime(job),
    }))
  }, [jobs, calculateRunTime])

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
      <Hero
        title="Background Jobs"
        description={["Monitor and manage background jobs for transcription and vectorization."]}
        icon={<GradientIcon icon={<Cog className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
            {statConfigs.map(config => {
              const value = stats[config.key as keyof QueueStats]
              return (
                <Card key={config.key}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={twMerge("text-2xl font-bold")}>{value}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <Table>
          <TableCaption>A list of background jobs and their current status.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Run Time</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobsWithRunTime.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium capitalize">{job.type}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariants[job.status] || "outline"}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {job.attempts}/{job.maxAttempts}
                  </TableCell>
                  <TableCell>{formatDate(job.createdAt)}</TableCell>
                  <TableCell>{job.runTime}</TableCell>
                  <TableCell>
                    {job.completedAt ? formatDate(job.completedAt) : job.failedAt ? formatDate(job.failedAt) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
