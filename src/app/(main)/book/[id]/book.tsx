"use client"
import { Player, PlayerRef } from "@/components/player"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranscript } from "@/hooks/use-transcript"
import { AudioFile, SearchResult } from "@/types/api"
import { parseAsStringEnum, useQueryState } from "nuqs"
import { useRef } from "react"
import { useMount } from "react-use"
import { twMerge } from "tailwind-merge"
import BookInfo from "./components/book-info"
import { ProcessingInfo } from "./components/processing-info"
import Bookmarks from "./tabs/bookmarks/bookmarks"
import Chapters from "./tabs/chapters/chapters"
import { Chat } from "./tabs/chat/chat"
import { Transcript } from "./tabs/transcript/transcript"
import useBookmarksStore from "@/stores/bookmarks"
import { BookmarkIcon, BookOpenIcon, CaptionsIcon, SparklesIcon } from "lucide-react"

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
    defaultValue: BookTab.Chat,
    parse: parseAsStringEnum(Object.values(BookTab)).withDefault(BookTab.Chat).parse,
  })
  const playerRef = useRef<PlayerRef>(null)
  const setBookmarks = useBookmarksStore(state => state.setBookmarks)

  const { fetchTranscript } = useTranscript()

  useMount(() => {
    fetchTranscript(id)
    setBookmarks(book.bookmarks || [])
  })

  const showProcessingInfo = !book.setup

  return (
    <div className="w-full min-h-full flex flex-col items-center gap-8 my-10 px-4">
      <BookInfo book={book} />

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 justify-center">
        {showProcessingInfo && <ProcessingInfo book={book} revalidate={revalidate} />}

        {/* {!hasDownloaded && <Downloader bookId={id} onComplete={onDownloadComplete} />} */}

        {!showProcessingInfo && (
          <>
            <Player book={book} files={files} ref={playerRef} controls="full" defaultTime={book.currentTime} />

            <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as BookTab)}>
              <TabsList className="self-center">
                <TabsTrigger value={BookTab.Chat}>
                  <SparklesIcon />
                  Chat
                </TabsTrigger>
                <TabsTrigger value={BookTab.Bookmarks}>
                  <BookmarkIcon />
                  Bookmarks
                </TabsTrigger>
                <TabsTrigger value={BookTab.Chapters}>
                  <BookOpenIcon />
                  Chapters
                </TabsTrigger>
                <TabsTrigger value={BookTab.Transcript}>
                  <CaptionsIcon />
                  Transcript
                </TabsTrigger>
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
        )}
      </div>
    </div>
  )
}
