"use client"
import { LLMSelectorDialog } from "@/components/dialogs/llm-selector-dialog"
import { Button } from "@/components/ui/button"
import { useLLMModels } from "@/hooks/use-llm-models"
import { AudioFile, SearchResult } from "@/types/api"
import axios from "axios"
import { SlidersHorizontal, WandSparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
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

  const [chapters] = useState(() => book.chapters.sort((a, b) => a.start - b.start))

  const chaptersSorted = chapters.sort((a, b) => a.start - b.start)

  async function generateChaptersSummary() {
    const toastId = `generate-chapters-summary-${book.id}-${Date.now()}`
    toast.loading("Generating chapters summary...", { id: toastId })
    try {
      const response = await axios.post(`/api/book/${book.id}/summary/generate/chapters`, {
        provider: provider,
        model: model,
      })

      toast.success(response.data.message, { id: toastId })
    } catch (error) {
      console.error("Failed to generate chapters summary:", error)
      toast.error("Failed to generate chapters summary", { id: toastId })
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div />

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
          <Chapter key={chapter.id} id={chapter.id.toString()} book={book} chapter={chapter} play={play} />
        ))}

        {chapters.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">No chapters found</p>
          </div>
        )}
      </div>
    </div>
  )
}
