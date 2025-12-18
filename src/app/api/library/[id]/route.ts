import { getLibraryItems } from "@/lib/audiobookshelf"
import { BookBasicInfo } from "@/types/api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{ books: BookBasicInfo[]; total: number; page: number; limit: number }> | NextResponse<{ error: string }>
> {
  try {
    const { id } = await params
    const libraryId = id

    const page = request.nextUrl.searchParams.get("page")
    const limit = request.nextUrl.searchParams.get("limit")

    const response = await getLibraryItems(libraryId, { page, limit })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
