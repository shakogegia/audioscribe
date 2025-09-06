"use client"
import { formatMarkdownLineBreaks, removeEndTimestampsAndBrackets } from "@/ai/transcription/utils/utils"
import { Markdown } from "@/components/markdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { forwardRef, Ref, memo } from "react"

interface TranscriptProps {
  text: string
  onTimeClick: (time: string) => void
}

function TranscriptContent({ text, onTimeClick }: TranscriptProps, ref: Ref<HTMLDivElement>) {
  return (
    <ScrollArea ref={ref} className="h-[500px] border rounded-lg px-2">
      <div className="transcript-container [&_.timestamp-button]:pr-1 [&_.active-time]:font-bold [&_.active-time]:text-blue-800 ">
        <Markdown text={formatMarkdownLineBreaks(removeEndTimestampsAndBrackets(text))} onTimeClick={onTimeClick} />
      </div>
    </ScrollArea>
  )
}

export default memo(forwardRef(TranscriptContent))
