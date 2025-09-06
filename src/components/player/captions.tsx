"use client"

import { useTranscript } from "@/hooks/use-transcript"
import { SearchResult } from "@/types/api"

interface CaptionsProps {
  book: SearchResult
  time: number
}

export interface BookPlayerRef {
  play: (time?: number) => void
}

export function Captions({ time }: CaptionsProps) {
  const { segments, findCaption } = useTranscript()
  const caption = findCaption(time)

  return (
    <div className="flex items-center justify-center gap-1 -mt-4 mb-0.5">
      {segments.length === 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">No captions found</div>
      )}

      {segments.length > 0 && (
        <div className="text-sm text-muted-foreground min-h-5 flex items-center justify-between w-full font-sans">
          <span className="font-light text-right flex-1 truncate">{caption?.previous?.text}</span>
          <span className="font-normal text-center flex-shrink-0 px-1">{caption?.current?.text}</span>
          <span className="font-light text-left flex-1 truncate">{caption?.next?.text}</span>
        </div>
      )}
    </div>
  )
}
