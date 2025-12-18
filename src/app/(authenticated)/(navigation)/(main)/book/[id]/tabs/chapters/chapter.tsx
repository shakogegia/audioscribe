"use client"
import { Markdown } from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChapterSummary, ChapterSummaryStatus } from "@/generated/prisma"
import { useLLMModels } from "@/hooks/use-llm-models"
import { formatTime } from "@/lib/format"
import { SearchResult } from "@/types/api"
import type { Chapter } from "@/types/audiobookshelf"
import axios from "axios"
import { ChevronsDown, ChevronsUp, Loader2Icon, WandSparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"

type ChapterProps = {
  id: string
  book: SearchResult
  play?: (time?: number) => void
  summaries?: ChapterSummary[]
  chapter: Chapter
}

export default function Chapter({ play, book, summaries = [], chapter }: ChapterProps) {
  const { provider, model } = useLLMModels()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false)

  async function generateChapterSummary() {
    toast.loading("Generating chapter summary...", { id: "generate-chapter-summary" })
    try {
      setIsGeneratingSummary(true)
      const response = await axios.post(`/api/book/${book.id}/summary/generate/chapter/${chapter.id}`, {
        provider: provider,
        model: model,
      })

      toast.success(response.data.message, { id: "generate-chapters-summary" })
    } catch (error) {
      console.error("Failed to generate chapters summary:", error)
      toast.error("Failed to generate chapters summary", { id: "generate-chapters-summary" })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const { summary, status } = summaries.find(summary => summary.chapterId === chapter.id) || { summary: "" }

  const canGenerateSummary =
    !isGeneratingSummary &&
    (!status || (status !== ChapterSummaryStatus.Pending && status !== ChapterSummaryStatus.Running))

  const isGenerating =
    status === ChapterSummaryStatus.Pending || status === ChapterSummaryStatus.Running || isGeneratingSummary

  return (
    <div className="flex flex-col gap-2 border rounded-md p-2 text-sm w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Badge className="cursor-pointer" variant="outline" onClick={() => play?.(chapter.start)}>
            <span className="font-sans">{formatTime(chapter.start)}</span>
          </Badge>

          <p className="font-normal outline-none w-full">{chapter.title}</p>

          <div className="flex items-center gap-2">
            <ChapterAction
              title="Generate chapter summary"
              onClick={generateChapterSummary}
              disabled={!canGenerateSummary}
            >
              {isGenerating ? <Loader2Icon className="animate-spin" /> : <WandSparkles className="w-4 h-4" />}
            </ChapterAction>

            <ChapterAction
              title={isCollapsed ? "Expand chapter" : "Collapse chapter"}
              onClick={() => setIsCollapsed(!isCollapsed)}
              disabled={!summary}
            >
              {isCollapsed ? <ChevronsDown className="w-4 h-4" /> : <ChevronsUp className="w-4 h-4" />}
            </ChapterAction>
          </div>
        </div>
      </div>

      {!isCollapsed && <Markdown text={summary} />}
    </div>
  )
}

function ChapterAction({
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
