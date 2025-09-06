"use client"
import { Markdown } from "@/components/markdown"
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
          `<p ${dataAttributes(segment.startTime)}><span class="${timeStampClasses()}">${formatMillisecondsToTime(
            segment.startTime
          )}</span><span class="text">${segment.text}</span></p>`
      )
      .join("")
  }, [segments])

  return (
    <ScrollArea ref={ref} className="h-[500px] border rounded-lg px-2">
      <div className="[&_.active-line]:font-bold [&_.active-line]:text-blue-800 ">
        <Markdown text={text} onTimeClick={onTimeClick} />
        <div
          className={twMerge(
            "prose max-w-none prose-headings:font-semibold",
            "prose-p:py-0.5 prose-p:my-0",
            "dark:prose-invert",
            "prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:pl-4 prose-blockquote:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300",
            "text-sm"
          )}
        >
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      </div>
    </ScrollArea>
  )
}

export default memo(forwardRef(TranscriptContent))
