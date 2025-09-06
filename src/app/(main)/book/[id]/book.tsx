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
  const setBookmarks = useBookmarksStore(state => state.setBookmarks)

  async function onDownloadComplete() {
    await revalidate(id)
    setHasDownloaded(true)
    setBookmarks(book.bookmarks)
  }

  useMount(() => {
    fetchTranscript(id)
  })

  return (
    <div className="w-full min-h-full flex flex-col items-center gap-8 mb-10 px-4">
      <Hero
        title={book.title}
        description={[book.authors.join(", ")]}
        content={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" onClick={() => transcribe(id)}>
              {book.transcribed ? "Transcripted" : "Transcribe"}
            </Badge>
            <Badge variant="secondary">Cache size: {book.cacheSize.humanReadableSize}</Badge>
          </div>
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
            <Player book={book} files={files} ref={playerRef} controls="full" />

            <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as BookTab)}>
              <TabsList className="self-center">
                <TabsTrigger value={BookTab.Bookmarks}>Bookmarks</TabsTrigger>
                <TabsTrigger value={BookTab.Chapters}>Chapters</TabsTrigger>
                <TabsTrigger value={BookTab.Transcript}>Transcript</TabsTrigger>
                <TabsTrigger value={BookTab.Chat}>Chat</TabsTrigger>
              </TabsList>

              {/* Bookmarks */}
              <TabsContent value="bookmarks" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Bookmarks id={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              {/* Chapters */}
              <TabsContent value="chapters" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Chapters id={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              {/* Transcript */}
              <TabsContent value="transcript" className={twMerge("data-[state=inactive]:hidden")}>
                <Transcript bookId={id} book={book} play={time => playerRef.current?.play(time)} />
              </TabsContent>

              {/* Chat */}
              <TabsContent value="chat" forceMount className={twMerge("data-[state=inactive]:hidden")}>
                <Chat bookId={id} book={book} files={files} play={time => playerRef.current?.play(time)} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
