"use client";
import { BookPlayer, BookPlayerRef } from "@/components/book-player";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { AudioFile, SearchResult } from "@/types/api";
import axios from "axios";
import {
  Bookmark as BookmarkIcon,
  Check,
  Loader2Icon,
  MessageCircle,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useBookmarksStore from "../stores/bookmarks";
import { AiChatDialog } from "./ai-chat-dialog";
import { AiConfigDialog } from "./ai-config-dialog";
import { Bookmark } from "./bookmark";
import { Downloader } from "./downloader";

export default function Book({ id, book, files }: { id: string; book: SearchResult; files: AudioFile[] }) {
  const bookPlayerRef = useRef<BookPlayerRef>(null);

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
    <div className="w-full min-h-full flex flex-col items-center gap-8 py-10 px-4">
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

      <div className="w-full max-w-xl">
        <BookPlayer book={book} files={files} ref={bookPlayerRef} controls="full" />
      </div>

      {!hasDownloaded && (
        <div className="max-w-xl mx-auto w-full">
          <Downloader bookId={id} onComplete={onDownloadComplete} />
        </div>
      )}

      {hasDownloaded && (
        <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex justify-center items-center gap-2">
              <BookmarkIcon className="w-6 h-6" />
              <h3 className="text-xl font-medium text-center">Bookmarks</h3>
            </div>

            <div className="flex justify-center items-center gap-2">
              <AiChatDialog bookId={id} book={book} files={files}>
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">AI Chatbot</span>
                </Button>
              </AiChatDialog>

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
              <Bookmark
                key={bookmark.createdAt}
                bookId={id}
                bookmark={bookmark}
                play={() => bookPlayerRef.current?.play(bookmark.time)}
              />
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
