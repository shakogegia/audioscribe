import { getBatchLibraryItems } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { BookBasicInfo } from "@/types/api"
import { NextResponse } from "next/server"
import { JobStatus } from "../../../../generated/prisma"

export type ProcessingResponse = {
  running: BookBasicInfo[]
  queued: BookBasicInfo[]
}

export async function GET(): Promise<NextResponse<ProcessingResponse> | NextResponse<{ error: string }>> {
  try {
    const [runningJobs, pendingJobs] = await Promise.all([
      prisma.job.findMany({
        where: { status: JobStatus.Running },
        distinct: ["bookId"],
        select: { bookId: true },
      }),
      prisma.job.findMany({
        where: { status: JobStatus.Pending },
        distinct: ["bookId"],
        select: { bookId: true },
      }),
    ])

    const runningIds = runningJobs.map(j => j.bookId)
    const filteredQueuedIds = pendingJobs.map(j => j.bookId).filter(id => !runningIds.includes(id))

    const allIds = [...new Set([...runningIds, ...filteredQueuedIds])]

    if (allIds.length === 0) {
      return NextResponse.json({ running: [], queued: [] })
    }

    const results = await getBatchLibraryItems(allIds)
    const resultMap = new Map(results.map(r => [r.id, r]))

    const running = runningIds.map(id => resultMap.get(id)).filter(Boolean) as BookBasicInfo[]
    const queued = filteredQueuedIds.map(id => resultMap.get(id)).filter(Boolean) as BookBasicInfo[]

    return NextResponse.json({ running, queued })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
