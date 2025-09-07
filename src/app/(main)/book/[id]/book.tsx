"use client"
import { Player, PlayerRef } from "@/components/player"
import { Hero } from "@/components/hero"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioFile, SearchResult } from "@/types/api"
import Image from "next/image"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import useBookmarksStore from "@/stores/bookmarks"
import { Chat } from "./tabs/chat/chat"
import Bookmarks from "./tabs/bookmarks/bookmarks"
import { Downloader } from "./components/downloader"
import { Transcript } from "./tabs/transcript/transcript"
import Chapters from "./tabs/chapters/chapters"
import { Badge } from "@/components/ui/badge"
import { parseAsStringEnum, useQueryState } from "nuqs"
import { useMount } from "react-use"
import { useTranscript } from "@/hooks/use-transcript"
import { TranscriptProgress } from "./components/transcript"
import BookInfo from "./components/book-info"
import { ProcessingInfo } from "./components/porcessing-info"

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
  const playerRef = useRef<PlayerRef>(null)

  const { fetchTranscript, transcribe } = useTranscript()

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [hasTranscripted, setHasTranscripted] = useState(false)
  const setBookmarks = useBookmarksStore(state => state.setBookmarks)

  async function onDownloadComplete() {
    await revalidate(id)
    setHasDownloaded(true)
    setBookmarks(book.bookmarks)
  }

  async function onTranscriptComplete() {
    await revalidate(id)
    setHasTranscripted(true)
  }

  useMount(() => {
    fetchTranscript(id)
  })

  return (
    <div className="w-full min-h-full flex flex-col items-center gap-8 mb-10 px-4">
      <BookInfo book={book} />

      <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
        <ProcessingInfo book={book} />

        {/* {!hasDownloaded && <Downloader bookId={id} onComplete={onDownloadComplete} />}

        {!hasTranscripted && <TranscriptProgress bookId={id} onComplete={onTranscriptComplete} />} */}

        {/* {hasDownloaded && (
          <>
            <Player book={book} files={files} ref={playerRef} controls="full" />

            <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as BookTab)}>
              <TabsList className="self-center">
                <TabsTrigger value={BookTab.Bookmarks}>Bookmarks</TabsTrigger>
                <TabsTrigger value={BookTab.Chapters}>Chapters</TabsTrigger>
                <TabsTrigger value={BookTab.Transcript}>Transcript</TabsTrigger>
                <TabsTrigger value={BookTab.Chat}>Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="bookmarks" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Bookmarks id={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              <TabsContent value="chapters" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Chapters id={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              <TabsContent value="transcript" className={twMerge("data-[state=inactive]:hidden")}>
                <Transcript bookId={id} book={book} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              <TabsContent value="chat" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Chat bookId={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>
            </Tabs>
          </>
        )} */}
      </div>
    </div>
  )
}
