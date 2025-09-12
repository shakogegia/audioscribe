import { getLibraryItems } from "@/lib/audiobookshelf"
import { SearchResult } from "@/types/api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SearchResult[]> | NextResponse<{ error: string }>> {
  try {
    const { id } = await params
    const libraryId = id
    const books = await getLibraryItems(libraryId)

    return NextResponse.json(books)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
