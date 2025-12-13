import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { BookSetupStatus } from "../../../../../../../generated/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const stages = await prisma.bookSetupProgress.findMany({
      where: { bookId },
      orderBy: { createdAt: "asc" },
    })

    if (!stages.length) {
      return NextResponse.json({ stages: [], currentStage: null })
    }

    const currentStage = stages.find(s => s.status === BookSetupStatus.Running)

    const book = await prisma.book.findUnique({ where: { id: bookId } })

    return NextResponse.json({
      stages,
      currentStage,
      book,
    })
  } catch (error) {
    console.error("Setup progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
