import { getBookFiles } from "@/lib/audiobookshelf"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const book = await getBookFiles(id)
    return NextResponse.json(book)
  } catch (error) {
    console.error("Book API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
