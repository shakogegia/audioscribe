import { AiModel, AiProvider } from "@/ai/types/ai"
import { ChapterSummaryStatus } from "@/generated/prisma"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { chapterSummaryQueue } from "@/server/jobs/queues/chapter-summary.queue"
import { NextRequest, NextResponse } from "next/server"

type GenerateChaptersRequestBody = {
  provider: AiProvider
  model: AiModel
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body: GenerateChaptersRequestBody = await request.json()

    const book = await getBook(id)

    // delete existing chapter summary
    await prisma.chapterSummary.deleteMany({
      where: {
        bookId: book.id,
        chapterId: { in: book.chapters.map(chapter => chapter.id) },
      },
    })

    // add new chapter summaries
    await prisma.chapterSummary.createMany({
      data: book.chapters.map(chapter => ({
        bookId: book.id,
        chapterId: chapter.id,
        model: body.model,
        summary: "",
        status: ChapterSummaryStatus.Pending,
      })),
    })

    book.chapters.forEach((chapter, index) => {
      chapterSummaryQueue.add(`${book.title} - ${chapter.title || `Chapter ${index + 1}`}`, {
        bookId: book.id,
        chapterId: chapter.id,
        provider: body.provider,
        model: body.model,
      })
    })

    return NextResponse.json({ message: "Chapters summary generation queued successfully" })
  } catch (error) {
    console.error("Generate chapters summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
