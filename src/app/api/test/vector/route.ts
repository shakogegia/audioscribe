import { getBook } from "@/lib/audiobookshelf"
import { setupBookFlow } from "@/server/jobs-new/setup.worker"
import { NextRequest, NextResponse } from "next/server"

// TODO: remove this route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  // const q = searchParams.get("q")
  const bookId = searchParams.get("id")

  // await vectorDb.initialize(bookId!)
  // const results = await vectorDb.searchSimilar(q!)

  const book = await getBook(bookId!)

  await setupBookFlow({ book })

  return NextResponse.json({ message: "Book setup flow queued" })
}
