import { jobQueue } from "@/jobs/queue"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status") || undefined
  const type = searchParams.get("type") || undefined
  const limit = parseInt(searchParams.get("limit") || "100")
  const offset = parseInt(searchParams.get("offset") || "0")

  try {
    if (searchParams.get("stats") === "true") {
      const stats = await jobQueue.getQueueStats()
      return NextResponse.json(stats)
    }

    const jobs = await jobQueue.getJobs(status, type, limit, offset)
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// TODO: remove this
export async function POST() {
  try {
    // const body = await request.json()
    // const { type, data, options } = body

    // if (!type || !data) {
    //   return NextResponse.json({ error: "Missing required fields: type, data" }, { status: 400 })
    // }

    // let jobId: string

    // // Use typed job functions for better validation
    // if (type === "setupBook") {
    //   jobId = await setupBook(data, options)
    // } else {
    //   // Fallback to generic add for unknown job types
    //   jobId = await jobQueue.add(type, data.bookId, data, options)
    // }

    return NextResponse.json({ jobId: "123" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create job:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get("action")

  try {
    if (action === "clear-completed") {
      const count = await jobQueue.clearCompletedJobs()
      return NextResponse.json({ deleted: count })
    }

    if (action === "clear-failed") {
      const count = await jobQueue.clearFailedJobs()
      return NextResponse.json({ deleted: count })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to perform action:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
