import { AiModel, AiProvider } from "@/ai/types/ai"
import { ChapterSummaryStatus } from "@/generated/prisma"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { chapterSummaryQueue } from "@/server/jobs/queues/chapter-summary.queue"
import { NextRequest, NextResponse } from "next/server"

type GenerateChapterRequestBody = {
  provider: AiProvider
  model: AiModel
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; chapterId: string }> }) {
  try {
    const { id, chapterId } = await params

    const body: GenerateChapterRequestBody = await request.json()

    const book = await getBook(id)
    const chapter = book.chapters.find(chapter => chapter.id === parseInt(chapterId))

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // delete existing chapter summary
    await prisma.chapterSummary.deleteMany({
      where: {
        bookId: id,
        chapterId: parseInt(chapterId),
      },
    })

    // add new chapter summaries
    await prisma.chapterSummary.create({
      data: {
        bookId: book.id,
        chapterId: parseInt(chapterId),
        model: body.model,
        summary: "",
        status: ChapterSummaryStatus.Pending,
      },
    })

    chapterSummaryQueue.add(`${book.title} - ${chapter.title || "Chapter"}`, {
      bookId: book.id,
      chapterId: chapter.id,
      provider: body.provider,
      model: body.model,
    })

    return NextResponse.json({ message: "Chapters summary generation queued successfully" })
  } catch (error) {
    console.error("Generate chapters summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
