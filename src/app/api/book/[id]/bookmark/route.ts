import { NextRequest, NextResponse } from "next/server";
import type * as Audiobookshelf from "@/types/audiobookshelf";
import { deleteBookmark, updateBookmarks } from "@/lib/audiobookshelf";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { bookmarks: Audiobookshelf.AudioBookmark[] };

    await updateBookmarks(id, body.bookmarks);

    return NextResponse.json({ message: "Bookmark updated" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const time = Number(searchParams.get("time"));

    await deleteBookmark(id, Number(time));

    return NextResponse.json({ message: "Bookmark deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
