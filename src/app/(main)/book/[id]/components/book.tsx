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
import { parseAsStringEnum, useQueryState } from "nuqs"

interface BookProps {
  id: string
  book: SearchResult
  files: AudioFile[]
  revalidate: (id: string) => void
}

enum BookTab {
  Bookmarks = "bookmarks",
  Chapters = "chapters",
  Chat = "chat",
  Transcript = "transcript",
}

export default function Book({ id, book, files, revalidate }: BookProps) {
  const [activeTab, setActiveTab] = useQueryState<BookTab>("tab", {
    defaultValue: BookTab.Bookmarks,
    parse: parseAsStringEnum(Object.values(BookTab)).withDefault(BookTab.Bookmarks).parse,
  })
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
        content={
          <>
            <Badge variant="outline">Cache size: {book.cacheSize.humanReadableSize}</Badge>
          </>
        }
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

            <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as BookTab)}>
              <TabsList className="self-center">
                <TabsTrigger value={BookTab.Bookmarks}>Bookmarks</TabsTrigger>
                <TabsTrigger value={BookTab.Chapters}>Chapters</TabsTrigger>
                <TabsTrigger value={BookTab.Chat}>Chat</TabsTrigger>
                <TabsTrigger value={BookTab.Transcript}>Transcript</TabsTrigger>
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
