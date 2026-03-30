import { AiModel, AiProvider } from "@/ai/types/ai"
import { generatePrompt } from "@/ai/prompts/helpers"
import { ChapterSummaryStatus } from "@/generated/prisma"
import { getBook } from "@/lib/audiobookshelf"
import { getTranscriptByRange } from "@/lib/transcript"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

type GenerateChapterRequestBody = {
  provider: AiProvider
  model: AiModel
}

async function generateChapterSummary(
  bookId: string,
  chapterId: number,
  provider: AiProvider,
  model: AiModel,
  chapterStart: number,
  chapterEnd: number
) {
  try {
    await prisma.chapterSummary.updateMany({
      where: { bookId, chapterId },
      data: { status: ChapterSummaryStatus.Running, model },
    })

    const transcripts = await getTranscriptByRange({ bookId, startTime: chapterStart, endTime: chapterEnd })
    const transcript = transcripts.map(t => t.text).join(" ")

    const summary = await generatePrompt({ provider, model, slug: "chapter-summary", params: { transcript } })

    await prisma.chapterSummary.updateMany({
      where: { bookId, chapterId },
      data: { status: ChapterSummaryStatus.Completed, summary, model },
    })
  } catch {
    await prisma.chapterSummary.updateMany({
      where: { bookId, chapterId },
      data: { status: ChapterSummaryStatus.Failed },
    })
  }
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

    // add new chapter summary
    await prisma.chapterSummary.create({
      data: {
        bookId: book.id,
        chapterId: parseInt(chapterId),
        model: body.model,
        summary: "",
        status: ChapterSummaryStatus.Pending,
      },
    })

    // Generate summary in the background
    generateChapterSummary(book.id, chapter.id, body.provider, body.model, chapter.start, chapter.end)

    return NextResponse.json({ message: "Chapters summary generation queued successfully" })
  } catch (error) {
    console.error("Generate chapters summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
