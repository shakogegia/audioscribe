import { getBatchLibraryItems } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { BookBasicInfo } from "@/types/api"
import { NextResponse } from "next/server"
import { JobStatus } from "../../../../generated/prisma"

export async function GET(): Promise<NextResponse<BookBasicInfo[]> | NextResponse<{ error: string }>> {
  try {
    const books = await prisma.job.findMany({
      where: { status: JobStatus.Running },
      select: { bookId: true },
    })

    const libraryItemIds = books.map(book => book.bookId)

    if (libraryItemIds.length === 0) {
      return NextResponse.json([])
    }

    const results = await getBatchLibraryItems(libraryItemIds!)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
