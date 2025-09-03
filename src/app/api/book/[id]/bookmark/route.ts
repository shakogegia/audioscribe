import { updateBookmarks } from "@/lib/audiobookshelf"
import type * as Audiobookshelf from "@/types/audiobookshelf"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { bookmarks: Audiobookshelf.AudioBookmark[] }

    await updateBookmarks(id, body.bookmarks)

    return NextResponse.json({ message: "Bookmark updated" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
