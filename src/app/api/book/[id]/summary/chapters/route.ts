import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const book = await getBook(id)

  const chapterSummaries = await prisma.chapterSummary.findMany({
    where: { bookId: book.id },
  })

  return NextResponse.json(chapterSummaries)
}
