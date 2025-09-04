import { SearchResult } from "@/types/api"
import { searchBook } from "@/lib/audiobookshelf"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchResult[]> | NextResponse<{ error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const libraryId = searchParams.get("libraryId")

    const results = await searchBook(libraryId!, query!)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
