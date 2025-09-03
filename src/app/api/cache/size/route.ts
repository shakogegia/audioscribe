import { folders } from "@/lib/folders"
import { readdir, stat } from "fs/promises"
import { NextResponse } from "next/server"
import path from "path"

export async function GET() {
  try {
    const size = await getDirSize(await folders.cache())

    const humanReadableSize =
      size < 1024 * 1024 * 1024
        ? `${(size / 1024 / 1024).toFixed(2)} MB`
        : `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`

    return NextResponse.json({ size, humanReadableSize }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getDirSize(dirPath: string) {
  let size = 0
  const files = await readdir(dirPath)

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i])
    const stats = await stat(filePath)

    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      size += await getDirSize(filePath)
    }
  }

  return size
}
