import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    const progress = await prisma.bookSetupProgress.findFirst({
      where: { bookId },
      orderBy: { createdAt: "desc" },
    })

    if (!progress) {
      return NextResponse.json({ progress: null })
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error("Setup progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}