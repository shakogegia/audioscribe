import { vectorDb } from "@/ai/lib/vector"
import { NextRequest, NextResponse } from "next/server"

// TODO: remove this route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")
  const bookId = searchParams.get("id")

  await vectorDb.initialize(bookId!)
  const results = await vectorDb.searchSimilar(q!)

  return NextResponse.json(results)
}
