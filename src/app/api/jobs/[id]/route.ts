import { NextRequest, NextResponse } from "next/server"
import { jobQueue } from "@/jobs/queue"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await jobQueue.getJob(params.id)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("Failed to fetch job:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action, delay } = body

    if (action === "retry") {
      const success = await jobQueue.retryJob(params.id, delay || 0)

      if (!success) {
        return NextResponse.json({ error: "Cannot retry job" }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to perform action:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await jobQueue.deleteJob(params.id)

    if (!success) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete job:", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}
