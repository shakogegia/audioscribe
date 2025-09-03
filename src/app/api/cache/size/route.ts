import { dirSize, folders, humanReadableSize } from "@/lib/folders"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const size = await dirSize(await folders.cache())

    return NextResponse.json({ size, humanReadableSize: await humanReadableSize(size) }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
