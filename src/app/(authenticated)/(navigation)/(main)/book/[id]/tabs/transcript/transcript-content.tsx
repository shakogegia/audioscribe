"use client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TranscriptSegment } from "@prisma/client"
import { forwardRef, memo, Ref, useMemo } from "react"
import { twMerge } from "tailwind-merge"

interface TranscriptProps {
  segments: TranscriptSegment[]
  onTimeClick: (time: string) => void
}

function formatMillisecondsToTime(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3600000)
  const minutes = Math.floor((milliseconds % 3600000) / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

function dataAttributes(milliseconds: number) {
  return `data-milliseconds="${milliseconds}" data-time="${formatMillisecondsToTime(milliseconds)}"`
}

function timeStampClasses() {
  return twMerge(
    "font-mono font-medium cursor-pointer mr-2",
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
  )
}

function TranscriptContent({ segments, onTimeClick }: TranscriptProps, ref: Ref<HTMLDivElement>) {
  const text = useMemo(() => {
    return segments
      .map(
        segment =>
          `<p ${dataAttributes(
            segment.startTime
          )} class="timestamp-button"><span class="${timeStampClasses()}">${formatMillisecondsToTime(
            segment.startTime
          )}</span><span class="text">${segment.text}</span></p>`
      )
      .join("")
  }, [segments])

  return (
    <ScrollArea ref={ref} className="h-[500px] border rounded-lg">
      <div className="[&_.active-line]:font-semibold [&_.active-line]:text-neutral-800 [&_.active-line]:bg-neutral-100 [&_.active-line]:dark:bg-neutral-700 [&_.active-line]:dark:text-neutral-200">
        <div
          className={twMerge(
            "prose max-w-none prose-headings:font-semibold",
            "prose-p:py-0.5 prose-p:my-0",
            "dark:prose-invert",
            "prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:pl-4 prose-blockquote:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300",
            "text-sm",
            "[&_.timestamp-button]:flex [&_.timestamp-button]:cursor-pointer",
            "prose-p:px-2 prose-p:hover:bg-neutral-100 prose-p:hover:dark:bg-neutral-800"
          )}
        >
          <div
            dangerouslySetInnerHTML={{ __html: text }}
            onClick={e => {
              const target = e.target as HTMLElement
              if (target.classList.contains("timestamp-button")) {
                const time = target.getAttribute("data-time")
                if (time) {
                  onTimeClick(time)
                }
              } else {
                // parent node is a p tag
                const p = target.parentElement
                if (p) {
                  const time = p.getAttribute("data-time")
                  if (time) {
                    onTimeClick(time)
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </ScrollArea>
  )
}

export default memo(forwardRef(TranscriptContent))
