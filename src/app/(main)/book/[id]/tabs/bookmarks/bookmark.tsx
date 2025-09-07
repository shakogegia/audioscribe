"use client"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAiConfig } from "@/hooks/use-ai-config"
import { formatTime } from "@/lib/format"
import useBookmarksStore from "@/stores/bookmarks"
import type * as Audiobookshelf from "@/types/audiobookshelf"
import axios from "axios"
import { Loader2, Trash, WandSparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"

interface BookmarksProps {
  bookId: string
  bookmark: Audiobookshelf.AudioBookmark
  play?: (time?: number) => void
}

export function Bookmark({ bookId, bookmark, play }: BookmarksProps) {
  const { aiConfig } = useAiConfig()

  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  const [showSuggestions, setShowSuggestions] = useState(false)

  const [suggestions, setSuggestions] = useState<string[]>([])

  const updateBookmark = useBookmarksStore(state => state.update)
  const removeBookmark = useBookmarksStore(state => state.remove)

  async function deleteBookmark() {
    removeBookmark(bookmark)
  }

  async function generateSuggestions() {
    if (isGeneratingSuggestions) return

    try {
      setIsGeneratingSuggestions(true)
      toast.loading("Generating suggestions...", { id: `ai-suggestions-${bookmark.time}` })

      const response = await axios.post(`/api/book/${bookId}/ai/suggest/bookmarks`, {
        time: bookmark.time,
        config: aiConfig,
      })

      const suggestions = response.data.suggestions || []
      setSuggestions(suggestions)
      setShowSuggestions(true)

      toast.success(`Generated ${suggestions.length} suggestions`, { id: `ai-suggestions-${bookmark.time}` })
    } catch (error: unknown) {
      console.error("Failed to generate suggestions:", error)

      let errorMessage = "Failed to generate suggestions"
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  function applySuggestion(suggestion: string) {
    updateBookmark({ ...bookmark, title: suggestion })
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="flex flex-col gap-2 border rounded-md p-2 text-sm w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Badge className="cursor-pointer" variant="outline" onClick={() => play?.(bookmark.time)}>
            {formatTime(bookmark.time)}
          </Badge>

          <input
            type="text"
            className="font-semibold outline-none w-full hover:underline"
            value={bookmark.title}
            onChange={e => updateBookmark({ ...bookmark, title: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <BookmarkAction onClick={generateSuggestions} title="Suggest bookmark" disabled={isGeneratingSuggestions}>
                {isGeneratingSuggestions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <WandSparkles className="w-4 h-4" />
                )}
              </BookmarkAction>
            </TooltipTrigger>
            <TooltipContent>Suggest a bookmark using AI</TooltipContent>
          </Tooltip>

          <ConfirmDialog
            title="Delete bookmark"
            description="Are you sure you want to delete this bookmark?"
            onConfirm={deleteBookmark}
          >
            <BookmarkAction title="Delete bookmark">
              <Trash className="w-4 h-4" />
            </BookmarkAction>
          </ConfirmDialog>

          {/* TODO: remove? */}
          {/* <BookmarkAction onClick={handlePlayClick} title="Toggle audio player">
            {showPlayer ? <ChevronsDownUpIcon className="w-4 h-4" /> : <ChevronsUpDownIcon className="w-4 h-4" />}
          </BookmarkAction> */}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">AI Suggestions:</div>

            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Hide suggestions
            </button>
          </div>
          <div className="grid gap-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="text-left text-sm p-2 rounded border hover:bg-muted transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
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
  ...props
}: {
  onClick?: VoidFunction
  children: React.ReactNode
  disabled?: boolean
  title?: string
} & React.ComponentProps<typeof Button>) {
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
      {...props}
    >
      {children}
    </Button>
  )
}
