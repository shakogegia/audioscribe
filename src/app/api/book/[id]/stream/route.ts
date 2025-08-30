import { NextRequest, NextResponse } from "next/server";
import { getBookFiles } from "@/lib/audiobookshelf";
import path from "path";
import os from "os";
import fs from "fs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);

    const time = Number(searchParams.get("time"));

    const files = await getBookFiles(id);
    const file = files.find(file => file.start <= time && file.start + file.duration >= time);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // local file = temp folder + file.path
    const localFile = path.join(os.tmpdir(), "audiobook-wizard", file.path);

    // Check if file exists locally
    if (!fs.existsSync(localFile)) {
      return NextResponse.json({ error: "File not found locally" }, { status: 404 });
    }

    const stat = fs.statSync(localFile);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(localFile, { start, end });

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      // Full file streaming
      const fileStream = fs.createReadStream(localFile);

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error) {
    console.error("Error streaming audio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
