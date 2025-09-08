import { setupBook } from "@/jobs/queue"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body = await request.json()

    const { model } = body

    if (!model) {
      return NextResponse.json({ error: "Missing model" }, { status: 400 })
    }

    const existingBook = await prisma.book.findUnique({ where: { id: bookId } })

    if (!existingBook) {
      await prisma.book.create({
        data: {
          id: bookId,
          model,
        },
      })
    }

    const jobId = await setupBook({ bookId, model }, { priority: 1, maxAttempts: 1 })

    return NextResponse.json({
      jobId,
      message: "Book setup job queued successfully",
    })
  } catch (error) {
    console.error("Setup book API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
