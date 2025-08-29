"use client";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/lib/api";
import Image from "next/image";
import { Bookmarks } from "./bookmarks";
import { Download } from "./download";
import { useState } from "react";

export default function Book({ id, book }: { id: string; book: SearchResult }) {
  const [hasDownloaded, setHasDownloaded] = useState(false);

  function onDownloadComplete() {
    setTimeout(() => {
      setHasDownloaded(true);
    }, 100);
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
          <Download bookId={id} onComplete={onDownloadComplete} />
        </div>
      )}

      {hasDownloaded && (
        <div className="flex flex-col gap-4 w-full">
          <h3 className="text-2xl font-semibold text-center">Bookmarks</h3>

          <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
            {book.bookmarks.map(bookmark => (
              <Bookmarks key={bookmark.createdAt} bookId={id} bookmark={bookmark} />
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="default">Submit</Button>
          </div>
        </div>
      )}
    </div>
  );
}
