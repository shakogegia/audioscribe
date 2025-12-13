import { sendNotification } from "@/lib/notification"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const bookId = searchParams.get("bookId")

  const success = await sendNotification(bookId!)
  return NextResponse.json({ success })
}
