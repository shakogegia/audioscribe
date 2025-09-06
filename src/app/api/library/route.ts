import { getAllLibraries } from "@/lib/audiobookshelf"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await getAllLibraries()
    return NextResponse.json(response)
  } catch (error) {
    console.error("Library API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
