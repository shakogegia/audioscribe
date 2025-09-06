"use client"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AudioFile, SearchResult } from "@/types/api"
import axios from "axios"
import { BookmarkPlus, Check, Loader2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useBookmarksStore from "@/stores/bookmarks"
import { Bookmark } from "./bookmark"
import { usePlayerStore } from "@/stores/player"
import { useTranscript } from "@/hooks/use-transcript"

type BookmarksProps = {
  id: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
}

export default function Bookmarks({ id, play }: BookmarksProps) {
  const bookmarks = useBookmarksStore(state => state.bookmarks)
  const currentTime = usePlayerStore(state => state.currentTime)
  const addBookmark = useBookmarksStore(state => state.add)
  const { findCaption } = useTranscript()
  const [isSaving, setIsSaving] = useState(false)

  async function updateBookmarks() {
    setIsSaving(true)
    toast.loading("Saving bookmarks...", { id: "save-bookmarks" })
    await axios.patch(`/api/book/${id}/bookmark`, { bookmarks })
    toast.success("Bookmarks updated", { id: "save-bookmarks" })
    setIsSaving(false)
  }

  function addBookmarkAtCurrentTime() {
    const caption = findCaption(currentTime)

    const title =
      caption.current?.text ?? caption.previous?.text ?? caption.next?.text ?? `Bookmark ${bookmarks.length + 1}`

    addBookmark({
      libraryItemId: id,
      title: title,
      time: currentTime,
      fileStartTime: 0,
      createdAt: Date.now(),
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex justify-center items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={addBookmarkAtCurrentTime}>
                <BookmarkPlus className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Bookmarks</span>
                Add Bookmark
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new bookmark at the current time</TooltipContent>
          </Tooltip>

          {/* <Button variant="outline" size="sm">
            <WandSparkles className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">AI Suggestions</span>
          </Button> */}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {bookmarks.map(bookmark => (
          <Bookmark key={bookmark.createdAt} bookId={id} bookmark={bookmark} play={play} />
        ))}

        {bookmarks.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">No bookmarks found</p>
          </div>
        )}
      </div>

      {bookmarks.length > 0 && (
        <div className="flex justify-center">
          <Button variant="default" onClick={updateBookmarks} disabled={isSaving}>
            {isSaving ? <Loader2Icon className="animate-spin" /> : <Check />}
            Save
          </Button>
        </div>
      )}
    </div>
  )
}
