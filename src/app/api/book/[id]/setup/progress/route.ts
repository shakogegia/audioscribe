import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

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

    // Determine current stage
    const currentStage = stages.find(s => s.status === "running") || 
                        stages.find(s => s.status === "failed") ||
                        stages[stages.length - 1]

    return NextResponse.json({ 
      stages,
      currentStage,
      // Legacy support - return the current stage as 'progress'
      progress: currentStage 
    })
  } catch (error) {
    console.error("Setup progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}