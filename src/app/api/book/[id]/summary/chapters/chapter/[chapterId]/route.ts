import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; chapterId: string }> }) {
  try {
    const { id, chapterId } = await params

    const book = await getBook(id)
    const chapter = book.chapters.find(chapter => chapter.id === parseInt(chapterId))

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // get chapter summary
    const chapterSummary = await prisma.chapterSummary.findFirst({
      where: {
        bookId: id,
        chapterId: parseInt(chapterId),
      },
    })

    return NextResponse.json(chapterSummary)
  } catch (error) {
    console.error("Get chapter summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
