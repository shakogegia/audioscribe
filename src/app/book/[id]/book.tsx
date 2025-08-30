"use client";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/types/api";
import axios from "axios";
import { Loader2Icon, Check, Bookmark as BookmarkIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark } from "./bookmark";
import { Downloader } from "./downloader";
import useBookmarksStore from "./store";

export default function Book({ id, book }: { id: string; book: SearchResult }) {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const setBookmarks = useBookmarksStore(state => state.setBookmarks);
  const bookmarks = useBookmarksStore(state => state.bookmarks);
  const [isSaving, setIsSaving] = useState(false);

  function onDownloadComplete() {
    setHasDownloaded(true);
    setBookmarks(book.bookmarks);
  }

  async function updateBookmarks() {
    setIsSaving(true);
    toast.loading("Saving bookmarks...", { id: "save-bookmarks" });
    await axios.patch(`/api/book/${id}/bookmark`, { bookmarks });
    toast.success("Bookmarks updated", { id: "save-bookmarks" });
    setIsSaving(false);
  }

  return (
    <div className="w-full h-full flex flex-col items-center gap-8 py-10 px-4">
      <Hero
        title={book.title}
        description={[book.authors.join(", ")]}
        icon={
          <Image
            src={book.coverPath ?? ""}
            alt={book.title}
            className="w-32 h-32 object-cover rounded-md shadow-md"
            width={128}
            height={128}
          />
        }
      />

      {!hasDownloaded && (
        <div className="max-w-xl mx-auto w-full">
          <Downloader bookId={id} onComplete={onDownloadComplete} />
        </div>
      )}

      {hasDownloaded && (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-center items-center gap-2">
            <BookmarkIcon className="w-6 h-6" />
            <h3 className="text-xl font-medium text-center">Bookmarks</h3>
          </div>

          <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
            {bookmarks.map(bookmark => (
              <Bookmark key={bookmark.createdAt} bookId={id} bookmark={bookmark} />
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
      )}
    </div>
  );
}
