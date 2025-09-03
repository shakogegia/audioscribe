import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import fs from "fs"
import fsPromises from "fs/promises"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const files = await getBookFiles(id)

    const audioFolder = await folders.book(id).downloads()

    let isAlreadyDownloaded = false

    for (const file of files) {
      const filePath = path.join(audioFolder, file.path)
      if (
        await fs.promises
          .access(filePath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)
      ) {
        isAlreadyDownloaded = true
        break
      }
    }

    if (isAlreadyDownloaded) {
      return NextResponse.json(files)
    }

    // Regular download without progress
    for (const file of files) {
      const response = await fetch(file.downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      await fsPromises.writeFile(path.join(audioFolder, file.path), Buffer.from(buffer))
    }

    return NextResponse.json(files)
  } catch (error) {
    console.error("Book API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
