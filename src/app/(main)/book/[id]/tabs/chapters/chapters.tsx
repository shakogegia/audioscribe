"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatTime } from "@/lib/format"
import { usePlayerStore } from "@/stores/player"
import { AudioFile, SearchResult } from "@/types/api"
import { BookmarkPlus, Check, Loader2Icon, Trash } from "lucide-react"
import { useState } from "react"
import { twMerge } from "tailwind-merge"

type ChaptersProps = {
  id: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
  getCurrentTime?: () => number
}

export default function Chapters({ play, book }: ChaptersProps) {
  const [isSaving] = useState(false)
  const currentTime = usePlayerStore(state => state.currentTime)

  const [chapters, setChapters] = useState(() => book.chapters.sort((a, b) => a.start - b.start))

  function addNewChapter() {
    setChapters([...chapters, { id: chapters.length + 1, start: currentTime, end: currentTime, title: "New Chapter " }])
  }

  const chaptersSorted = chapters.sort((a, b) => a.start - b.start)

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex justify-center items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={addNewChapter}>
                <BookmarkPlus className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Chapters</span>
                Add Chapter
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new chapter at the current time</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {chaptersSorted.map((chapter, index) => (
          <div key={chapter.start + index} className="flex flex-col gap-2 border rounded-md p-2 text-sm w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full">
                <Badge className="cursor-pointer" variant="outline" onClick={() => play?.(chapter.start)}>
                  <span className="font-sans">{formatTime(chapter.start)}</span>
                </Badge>

                <input
                  type="text"
                  className="font-normal outline-none w-full hover:underline"
                  defaultValue={chapter.title}
                />

                <div className="flex items-center gap-2">
                  <BookmarkAction title="Delete chapter">
                    <Trash className="w-4 h-4" />
                  </BookmarkAction>
                </div>
              </div>
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">No chapters found</p>
          </div>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="flex justify-center">
          <Button variant="default" disabled={isSaving}>
            {isSaving ? <Loader2Icon className="animate-spin" /> : <Check />}
            Save
          </Button>
        </div>
      )}
    </div>
  )
}

function BookmarkAction({
  onClick,
  children,
  disabled,
  title,
}: {
  onClick?: VoidFunction
  children: React.ReactNode
  disabled?: boolean
  title?: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={twMerge(
        "w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50",
        "transition-all duration-200 ease-in-out [&:hover_svg]:scale-105"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  )
}
