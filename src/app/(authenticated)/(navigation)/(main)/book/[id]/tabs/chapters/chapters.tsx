"use client"
import { LLMSelectorDialog } from "@/components/dialogs/llm-selector-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChapterSummary } from "@/generated/prisma"
import { useLLMModels } from "@/hooks/use-llm-models"
import { usePlayerStore } from "@/stores/player"
import { AudioFile, SearchResult } from "@/types/api"
import axios from "axios"
import { BookmarkPlus, Check, Loader2Icon, SlidersHorizontal, WandSparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import Chapter from "./chapter"

type ChaptersProps = {
  id: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
  getCurrentTime?: () => number
}

export default function Chapters({ play, book }: ChaptersProps) {
  const { provider, model } = useLLMModels()
  const [isSaving] = useState(false)
  const currentTime = usePlayerStore(state => state.currentTime)

  const { data: chapterSummaries } = useSWR<ChapterSummary[]>(`/api/book/${book.id}/summary/chapters`, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const [chapters, setChapters] = useState(() => book.chapters.sort((a, b) => a.start - b.start))

  function addNewChapter() {
    setChapters([...chapters, { id: chapters.length + 1, start: currentTime, end: currentTime, title: "New Chapter " }])
  }

  const chaptersSorted = chapters.sort((a, b) => a.start - b.start)

  async function generateChaptersSummary() {
    toast.loading("Generating chapters summary...", { id: "generate-chapters-summary" })
    try {
      const response = await axios.post(`/api/book/${book.id}/summary/generate/chapters`, {
        provider: provider,
        model: model,
      })

      toast.success(response.data.message, { id: "generate-chapters-summary" })
    } catch (error) {
      console.error("Failed to generate chapters summary:", error)
      toast.error("Failed to generate chapters summary", { id: "generate-chapters-summary" })
    }
  }

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

        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateChaptersSummary}>
            <WandSparkles className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Generate Chapters Summaries</span>
            Generate Chapters Summaries
          </Button>

          <LLMSelectorDialog>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">LLM Configuration</span>
            </Button>
          </LLMSelectorDialog>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {chaptersSorted.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            id={chapter.id.toString()}
            book={book}
            summaries={chapterSummaries}
            chapter={chapter}
            play={play}
          />
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
