"use client"
import { BookPlayer, BookPlayerRef } from "@/components/book-player"
import { Hero } from "@/components/hero"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioFile, SearchResult } from "@/types/api"
import Image from "next/image"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import useBookmarksStore from "../../../../../stores/bookmarks"
import { AiChat } from "./ai-chat"
import Bookmarks from "./bookmarks"
import { Downloader } from "./downloader"
import { Transcript } from "./transcript"
import Chapters from "./chapters"
import { Badge } from "@/components/ui/badge"

interface BookProps {
  id: string
  book: SearchResult
  files: AudioFile[]
  revalidate: (id: string) => void
}

export default function Book({ id, book, files, revalidate }: BookProps) {
  const bookPlayerRef = useRef<BookPlayerRef>(null)

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const setBookmarks = useBookmarksStore(state => state.setBookmarks)

  async function onDownloadComplete() {
    await revalidate(id)
    setHasDownloaded(true)
    setBookmarks(book.bookmarks)
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center gap-8 my-10 px-4">
      <Hero
        title={book.title}
        description={[book.authors.join(", ")]}
        content={<Badge variant="outline">{book.cacheSize.humanReadableSize}</Badge>}
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

      <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
        {!hasDownloaded && <Downloader bookId={id} onComplete={onDownloadComplete} />}

        {hasDownloaded && (
          <>
            <BookPlayer book={book} files={files} ref={bookPlayerRef} controls="full" />

            <Tabs defaultValue="bookmarks">
              <TabsList className="self-center">
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
              <TabsContent value="bookmarks" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Bookmarks id={id} book={book} files={files} play={time => bookPlayerRef.current?.play(time)} />
              </TabsContent>
              <TabsContent value="chapters" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Chapters
                  id={id}
                  book={book}
                  files={files}
                  play={time => bookPlayerRef.current?.play(time)}
                  getCurrentTime={() => bookPlayerRef.current?.getCurrentTime() ?? 0}
                />
              </TabsContent>
              <TabsContent value="chat" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <AiChat bookId={id} book={book} files={files} play={time => bookPlayerRef.current?.play(time)} />
              </TabsContent>
              <TabsContent value="transcript" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Transcript bookId={id} book={book} files={files} play={time => bookPlayerRef.current?.play(time)} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
