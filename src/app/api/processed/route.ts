import { getBatchLibraryItems } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import { BookBasicInfo } from "@/types/api"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse<BookBasicInfo[]> | NextResponse<{ error: string }>> {
  try {
    const books = await prisma.book.findMany({
      where: { audioProcessed: true, downloaded: true, transcribed: true, vectorized: true },
    })
    const libraryItemIds = books.map(book => book.id)

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
