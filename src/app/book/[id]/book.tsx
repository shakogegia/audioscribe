"use client";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/lib/api";
import Image from "next/image";
import { useState } from "react";
import { Downloader } from "./downloader";
import useBookmarksStore from "./store";
import { Bookmark } from "./bookmark";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import { toast } from "sonner";
import axios from "axios";

export default function Book({ id, book }: { id: string; book: SearchResult }) {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const setBookmarks = useBookmarksStore(state => state.setBookmarks);
  const bookmarks = useBookmarksStore(state => state.bookmarks);

  function onDownloadComplete() {
    setHasDownloaded(true);
    setBookmarks(book.bookmarks);
  }

  async function updateBookmarks() {
    await axios.patch(`/api/book/${id}/bookmark`, { bookmarks });
    toast.success("Bookmarks updated");
  }

  return (
    <div className="w-full h-full flex flex-col items-center gap-8 py-10">
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
          <h3 className="text-2xl font-semibold text-center">Bookmarks</h3>

          <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
            {bookmarks.map(bookmark => (
              <Bookmark key={bookmark.createdAt} bookId={id} bookmark={bookmark} />
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="default" onClick={updateBookmarks}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
