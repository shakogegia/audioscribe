import { getContinueListening } from "@/lib/audiobookshelf"
import { BookBasicInfo } from "@/types/api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<BookBasicInfo[]> | NextResponse<{ error: string }>> {
  try {
    const { id } = await params
    const books = await getContinueListening(id)
    return NextResponse.json(books)
  } catch (error) {
    console.error("Continue listening API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
