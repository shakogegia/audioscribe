import { getBookFiles } from "@/lib/audiobookshelf";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { tempFolder } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const isStream = url.searchParams.get("stream") === "true";

  try {
    const files = await getBookFiles(id);

    await fs.promises.mkdir(tempFolder, { recursive: true });

    let isAlreadyDownloaded = false;

    for (const file of files) {
      const filePath = path.join(tempFolder, file.path);
      if (
        await fs.promises
          .access(filePath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)
      ) {
        isAlreadyDownloaded = true;
        break;
      }
    }

    if (!isStream) {
      // Regular download without progress
      for (const file of files) {
        const response = await fetch(file.downloadUrl);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        fs.writeFileSync(path.join(tempFolder, file.path), Buffer.from(buffer));
      }

      return NextResponse.json(files);
    }

    if (isAlreadyDownloaded) {
      // return completed stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: "completed",
                files,
                totalFiles: files.length,
                totalBytes: files.reduce((sum, file) => sum + file.size, 0),
                downloadedBytes: files.reduce((sum, file) => sum + file.size, 0),
                totalSize: formatBytes(files.reduce((sum, file) => sum + file.size, 0)),
                downloadedSize: formatBytes(files.reduce((sum, file) => sum + file.size, 0)),
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Stream with progress updates
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let completedFiles = 0;
          let downloadedBytes = 0;
          const totalFiles = files.length;
          const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

          // Send initial progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                progress: 0,
                status: "starting",
                totalFiles,
                completedFiles: 0,
                totalBytes,
                downloadedBytes: 0,
                totalSize: formatBytes(totalBytes),
                downloadedSize: formatBytes(0),
              })}\n\n`
            )
          );

          for (const file of files) {
            // Send current file start status
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  progress: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
                  status: "downloading",
                  currentFile: file.fileName,
                  currentFileSize: formatBytes(file.size),
                  totalFiles,
                  completedFiles,
                  totalBytes,
                  downloadedBytes,
                  totalSize: formatBytes(totalBytes),
                  downloadedSize: formatBytes(downloadedBytes),
                })}\n\n`
              )
            );

            // Stream download with progress updates
            const response = await fetch(file.downloadUrl);
            if (!response.ok) {
              throw new Error(`Failed to download ${file.path}: ${response.statusText}`);
            }

            const contentLength = response.headers.get("content-length");
            const expectedSize = contentLength ? parseInt(contentLength, 10) : file.size;

            const filePath = path.join(tempFolder, file.path);
            const writeStream = fs.createWriteStream(filePath);

            let fileDownloadedBytes = 0;
            const reader = response.body?.getReader();

            if (!reader) {
              throw new Error(`No readable stream for ${file.path}`);
            }

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                if (value) {
                  writeStream.write(Buffer.from(value));
                  fileDownloadedBytes += value.length;
                  downloadedBytes += value.length;

                  // Send progress update during file download
                  const currentProgress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
                  const fileProgress = expectedSize > 0 ? Math.round((fileDownloadedBytes / expectedSize) * 100) : 0;

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        progress: currentProgress,
                        status: "downloading",
                        currentFile: file.fileName,
                        currentFileSize: formatBytes(file.size),
                        currentFileProgress: fileProgress,
                        currentFileDownloaded: formatBytes(fileDownloadedBytes),
                        totalFiles,
                        completedFiles,
                        totalBytes,
                        downloadedBytes,
                        totalSize: formatBytes(totalBytes),
                        downloadedSize: formatBytes(downloadedBytes),
                      })}\n\n`
                    )
                  );
                }
              }
            } finally {
              reader.releaseLock();
              writeStream.end();
            }

            // Ensure downloadedBytes matches file size (in case of content-length mismatch)
            const actualFileSize = fs.statSync(filePath).size;
            const byteDifference = actualFileSize - fileDownloadedBytes;
            downloadedBytes += byteDifference;

            completedFiles++;

            // Send file completion status
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  progress: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 100,
                  status: completedFiles === totalFiles ? "completed" : "downloading",
                  currentFile: file.fileName,
                  currentFileSize: formatBytes(file.size),
                  currentFileProgress: 100,
                  totalFiles,
                  completedFiles,
                  totalBytes,
                  downloadedBytes,
                  totalSize: formatBytes(totalBytes),
                  downloadedSize: formatBytes(downloadedBytes),
                })}\n\n`
              )
            );
          }

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                progress: 100,
                status: "completed",
                totalFiles,
                completedFiles,
                totalBytes,
                downloadedBytes,
                totalSize: formatBytes(totalBytes),
                downloadedSize: formatBytes(downloadedBytes),
                files,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Download error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Download failed",
                status: "error",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Book API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
