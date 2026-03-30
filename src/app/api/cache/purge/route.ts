import { clearFolder, folders } from "@/lib/folders"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const directory = await folders.cache()
    const results = await clearFolder(directory)

    // clear all data from the database (child tables first due to foreign keys)
    await prisma.chapterSummary.deleteMany({})
    await prisma.transcriptSegment.deleteMany({})
    await prisma.bookSetupProgress.deleteMany({})
    await prisma.audioChunk.deleteMany({})
    await prisma.job.deleteMany({})
    await prisma.book.deleteMany({})

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
