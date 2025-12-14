import { folders } from "@/lib/folders"
import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; audioId: string }> }) {
  try {
    const { id: bookId, audioId } = await params

    const ttsFolder = await folders.book(bookId).tts()
    const audioFile = path.join(ttsFolder, `${audioId}.wav`)

    // Check if file exists
    if (!fs.existsSync(audioFile)) {
      return NextResponse.json({ error: "TTS audio file not found" }, { status: 404 })
    }

    const stat = fs.statSync(audioFile)
    const fileSize = stat.size
    const range = request.headers.get("range")

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = end - start + 1

      const fileStream = fs.createReadStream(audioFile, { start, end })

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "audio/mp4",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      })
    } else {
      // Full file streaming
      const fileStream = fs.createReadStream(audioFile)

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": "audio/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      })
    }
  } catch (error) {
    console.error("Error streaming TTS audio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
