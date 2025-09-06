"use client"

import { Progress } from "@/components/ui/progress"
import { useState, useRef, useEffect } from "react"
import { useMount } from "react-use"

export function Downloader({ bookId, onComplete }: { bookId: string; onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [currentFile, setCurrentFile] = useState<string>("")
  const eventSourceRef = useRef<EventSource | null>(null)

  async function download() {
    if (isDownloading) return

    setIsDownloading(true)
    setProgress(0)
    setStatus("Initializing...")
    setCurrentFile("")

    try {
      const eventSource = new EventSource(`/api/book/${bookId}/download/stream`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.error) {
            setStatus(`Error: ${data.error}`)
            setIsDownloading(false)
            eventSource.close()
            return
          }

          setProgress(data.progress || 0)

          switch (data.status) {
            case "starting":
              setStatus(`Starting download... (${data.totalSize || "calculating size"})`)
              break
            case "downloading":
              const downloadedSize = data.downloadedSize || "0 B"
              const totalSize = data.totalSize || "Unknown"
              const fileProgress = data.currentFileProgress ? ` (${data.currentFileProgress}%)` : ""
              const fileDownloaded = data.currentFileDownloaded ? ` - ${data.currentFileDownloaded}` : ""
              setStatus(`File ${data.completedFiles + 1}/${data.totalFiles} - ${totalSize} / ${downloadedSize}`)
              setCurrentFile((data.currentFile || "") + fileProgress + fileDownloaded)
              break
            case "completed":
              setStatus(`Download completed! (${data.totalSize || "Unknown size"})`)
              setCurrentFile("")
              setIsDownloading(false)
              eventSource.close()
              onComplete()
              break
            default:
              setStatus(data.status || "Processing...")
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error)
          setStatus("Error processing download")
          setIsDownloading(false)
          eventSource.close()
        }
      }

      eventSource.onerror = error => {
        console.error("EventSource error:", error)
        setStatus("Connection error occurred")
        setIsDownloading(false)
        eventSource.close()
      }
    } catch (error) {
      console.error("Download error:", error)
      setStatus("Failed to start download")
      setIsDownloading(false)
    }
  }

  useMount(() => download())

  // Cleanup EventSource on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-4 w-full items-center">
        <div className="flex-1">
          <Progress value={progress} />
          <div className="text-sm text-muted-foreground mt-1">
            {status && <div>{status}</div>}
            {currentFile && <div className="truncate">Current: {currentFile}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
