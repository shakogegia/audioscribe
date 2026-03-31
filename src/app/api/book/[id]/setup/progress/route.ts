import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { JobStatus } from "../../../../../../../generated/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const jobs = await prisma.job.findMany({
      where: { bookId },
      orderBy: [{ sequenceOrder: "asc" }, { chunkIndex: "asc" }],
    })

    if (!jobs.length) {
      return NextResponse.json({ stages: [], currentStage: null })
    }

    // Group jobs by type for stage-level summary
    const stageMap = new Map<string, { status: string; progress: number; error: string | null; startedAt: Date | null; completedAt: Date | null; totalChunks: number; completedChunks: number; currentChunkProgress: number }>()

    for (const job of jobs) {
      const existing = stageMap.get(job.type)
      if (!existing) {
        stageMap.set(job.type, {
          status: job.status,
          progress: job.progress,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          totalChunks: job.type === "Transcribe" ? 1 : 0,
          completedChunks: job.type === "Transcribe" && job.status === JobStatus.Completed ? 1 : 0,
          currentChunkProgress: job.type === "Transcribe" && job.status === JobStatus.Running ? job.progress : 0,
        })
      } else if (job.type === "Transcribe") {
        // Aggregate transcribe chunk jobs
        existing.totalChunks++
        if (job.status === JobStatus.Completed) {
          existing.completedChunks++
        }
        if (job.status === JobStatus.Running) {
          existing.status = "Running"
          existing.currentChunkProgress = job.progress
          existing.startedAt = existing.startedAt || job.startedAt
        }
        if (job.status === JobStatus.Failed) {
          existing.status = "Failed"
          existing.error = job.error
        }
        // Calculate overall transcribe progress from chunks
        if (existing.totalChunks > 0) {
          existing.progress = Math.round((existing.completedChunks / existing.totalChunks) * 100 * 100) / 100
        }
      }
    }

    // Convert to array format
    const stages = Array.from(stageMap.entries()).map(([type, data]) => ({
      stage: type,
      status: data.status,
      progress: data.progress,
      error: data.error,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      totalChunks: data.totalChunks,
      completedChunks: data.completedChunks,
      currentChunkProgress: data.currentChunkProgress,
    }))

    const currentStage = stages.find(s => s.status === "Running") || null

    // Check if this book is queued behind another book
    const allPending = jobs.length > 0 && jobs.every(j => j.status === JobStatus.Pending)
    let queued = false
    if (allPending) {
      const runningJob = await prisma.job.findFirst({
        where: { status: JobStatus.Running, bookId: { not: bookId } },
      })
      queued = !!runningJob
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } })

    return NextResponse.json({ stages, currentStage, book, queued })
  } catch (error) {
    console.error("Setup progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
