"use client";
import { Button } from "@/components/ui/button";
import { AudioFile, SearchResult } from "@/types/api";
import axios from "axios";
import { Bookmark as BookmarkIcon, Check, Loader2Icon, SlidersHorizontal, WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useBookmarksStore from "../stores/bookmarks";
import { AiConfigDialog } from "./ai-config-dialog";
import { Bookmark } from "./bookmark";

type BookmarksProps = {
  id: string;
  book: SearchResult;
  files: AudioFile[];
  play: (time?: number) => void;
};

export default function Bookmarks({ id, book, files, play }: BookmarksProps) {
  const bookmarks = useBookmarksStore(state => state.bookmarks);
  const [isSaving, setIsSaving] = useState(false);

  async function updateBookmarks() {
    setIsSaving(true);
    toast.loading("Saving bookmarks...", { id: "save-bookmarks" });
    await axios.patch(`/api/book/${id}/bookmark`, { bookmarks });
    toast.success("Bookmarks updated", { id: "save-bookmarks" });
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex justify-center items-center gap-2">
          <BookmarkIcon className="w-6 h-6" />
          <h3 className="text-xl font-medium text-center">Bookmarks</h3>
        </div>

        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="icon">
            <WandSparkles className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">AI Suggestions</span>
          </Button>

          <AiConfigDialog>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Adjust</span>
            </Button>
          </AiConfigDialog>
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
  );
}
