import { generatePrompt } from "@/ai/prompts/helpers"
import { getDefaultModel } from "@/ai/providers"
import { ChapterSummaryStatus } from "@/generated/prisma"
import { getBook } from "@/lib/audiobookshelf"
import { getTranscriptByRange } from "@/lib/transcript"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

async function generateChapterSummary(
  bookId: string,
  chapterId: number,
  model: string,
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

    const summary = await generatePrompt({ slug: "chapter-summary", params: { transcript } })

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { model } = await getDefaultModel()

    const book = await getBook(id)

    // delete existing chapter summaries
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
        model,
        summary: "",
        status: ChapterSummaryStatus.Pending,
      })),
    })

    // Generate summaries in the background
    book.chapters.forEach(chapter => {
      generateChapterSummary(book.id, chapter.id, model, chapter.start, chapter.end)
    })

    return NextResponse.json({ message: "Chapters summary generation queued successfully" })
  } catch (error) {
    console.error("Generate chapters summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
