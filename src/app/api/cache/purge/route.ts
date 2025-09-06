import { clearFolder, folders } from "@/lib/folders"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const directory = await folders.cache()
    const results = await clearFolder(directory)

    return NextResponse.json(
      {
        message: "Cache purge completed",
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
