"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { formatTime } from "@/lib/format"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { useMemo, useState } from "react"

type ChatContextDialogProps = {
  book: SearchResult
  children: React.ReactNode
  onApply: (context: { time: number; before: number; after: number }) => void
}

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabsContent } from "@radix-ui/react-tabs"
import { BookmarkIcon, CaptionsIcon, ClockIcon, MousePointerClickIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Separator } from "../ui/separator"

export function ChatContextDialog({ book, children, onApply }: ChatContextDialogProps) {
  const [open, setOpen] = useState(false)

  const [contextType, setContextType] = useState<"by-time" | "by-chapter">("by-time")
  const [timeToUse, setTimeToUse] = useState<"abs" | "player">("abs")
  const [chapterToUse, setChapterToUse] = useState<"current" | "previous" | "custom">("current")
  const [customChapterId, setCustomChapterId] = useState<string | null>(null)

  const customChapter = useMemo(() => {
    if (!customChapterId) return null
    return book.chapters.find(chapter => chapter.id?.toString() === customChapterId)
  }, [customChapterId, book.chapters])

  // before and after
  const [before, setBefore] = useState(0)
  const [after, setAfter] = useState(0)

  const absTime = book.currentTime
  const playerTime = usePlayerStore(state => state.currentTime)

  const times = {
    abs: absTime,
    player: playerTime,
  }

  const currentTime = times[timeToUse] || playerTime

  const duration = useMemo(() => {
    return {
      max: {
        before: currentTime,
        after: book.duration - currentTime,
      },
    }
  }, [book.duration, currentTime])

  const currentChapter = useMemo(() => {
    return book.chapters.find(chapter => chapter.start <= currentTime && chapter.end >= currentTime)
  }, [currentTime, book.chapters])

  const previousChapter = useMemo(() => {
    if (!currentChapter) return null
    const currentChapterIndex = book.chapters.findIndex(chapter => chapter.id === currentChapter.id)
    return book.chapters[currentChapterIndex - 1]
  }, [currentChapter, book.chapters])

  function setContextTime({ before = 0, after = 0 }: { before?: number; after?: number }) {
    setBefore(before)
    setAfter(after)
  }

  function apply() {
    onApply({ time: currentTime, before, after })

    if (contextType === "by-chapter") {
      if (!customChapterId) return
      const chapter = book.chapters.find(chapter => chapter.id?.toString() === customChapterId)
      if (!chapter) return
      onApply({ time: currentTime, before: chapter.start, after: chapter.end })
    } else {
      onApply({ time: currentTime, before, after })
    }

    setOpen(false)
  }

  const showTimeSource = absTime !== playerTime

  const selectedChapter = useMemo(() => {
    if (chapterToUse === "current") return currentChapter
    if (chapterToUse === "previous") return previousChapter
    if (chapterToUse === "custom") return customChapter
    return null
  }, [chapterToUse, currentChapter, previousChapter, customChapter])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Chat Context</DialogTitle>
          </DialogHeader>

          <Alert>
            <CaptionsIcon />
            <AlertTitle>Select transcript position to use for the chat context to LLM</AlertTitle>
            <AlertDescription>
              <p>
                Adjust the transcript portion tailored to your needs. Choose transcript segments that best represent the
                context you want to provide.
              </p>
            </AlertDescription>
          </Alert>

          {showTimeSource && (
            <>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col">
                    <Label>Playback progress</Label>
                  </div>

                  <Tabs
                    defaultValue={timeToUse}
                    className="items-end"
                    onValueChange={value => setTimeToUse(value as "abs" | "player")}
                  >
                    <TabsList>
                      <TabsTrigger value="abs">
                        From Audiobookshelf{" "}
                        <span className="text-xs text-muted-foreground">{formatTime(absTime ?? 0)}</span>
                      </TabsTrigger>
                      <TabsTrigger value="player">
                        From Player <span className="text-xs text-muted-foreground">{formatTime(playerTime ?? 0)}</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <Separator />
            </>
          )}

          <Tabs
            className="grid gap-4"
            defaultValue={contextType}
            onValueChange={value => setContextType(value as "by-time" | "by-chapter")}
          >
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label>Select Transcript by</Label>
              <div className="flex justify-end">
                <TabsList>
                  <TabsTrigger value="by-time">
                    <ClockIcon />
                    Time
                  </TabsTrigger>
                  <TabsTrigger value="by-chapter">
                    <BookmarkIcon />
                    Chapter
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <Separator />

            <TabsContent value="by-time" className="grid gap-4">
              <div className="grid gap-4 h-24">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="option-one">Transcript portion</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MousePointerClickIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setContextTime({ before: 5 * 60 })}>
                            Last 5 minutes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setContextTime({ before: 10 * 60 })}>
                            Last 10 minutes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setContextTime({ before: 30 * 60 })}>
                            Last 30 minutes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setContextTime({ before: 60 * 60 })}>
                            Last 1 Hour
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setContextTime({ after: 10 * 60 })}>
                            Next 10 minutes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setContextTime({ after: 5 * 60, before: 5 * 60 })}>
                            Around 10 minutes
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-1 mt-4">
                    <div className="flex justify-center text-center text-xs text-muted-foreground relative">
                      <span>Earlier</span>
                    </div>
                    <div className="flex justify-center text-center text-xs text-muted-foreground">
                      <span>Later</span>
                    </div>

                    <div className="w-full h-px bg-neutral-300 relative col-span-full">
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-4 bottom-0 w-px h-4 bg-amber-400"></div>

                      <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-12  bottom-0 text-xs text-muted-foreground font-mono flex flex-col text-center">
                        <span className="text-[10px]">Current time</span>
                        <span>{formatTime(currentTime)}</span>
                      </div>
                    </div>

                    <div className="col-span-full h-1" />

                    <div className="grid grid-cols-2 col-span-full gap-2">
                      <div className="grid gap-2">
                        <Slider
                          value={[before]}
                          max={duration.max.before}
                          step={1}
                          dir="rtl"
                          onValueChange={value => setBefore(value[0])}
                        />
                        <input
                          className="text-xs text-muted-foreground text-center font-mono"
                          value={`-${formatTime(before)}`}
                          readOnly
                        />
                      </div>

                      <div className="grid gap-2">
                        <Slider
                          value={[after]}
                          max={duration.max.after}
                          step={1}
                          onValueChange={value => setAfter(value[0])}
                        />
                        <input
                          className="text-xs text-muted-foreground text-center font-mono"
                          value={`+${formatTime(after)}`}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="by-chapter" className="grid gap-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="flex flex-col gap-0.5 items-start">
                    <span>Chapter to use</span>
                    {selectedChapter && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(selectedChapter.start)} - {formatTime(selectedChapter.end)}
                      </span>
                    )}
                  </Label>

                  <Tabs
                    defaultValue={chapterToUse}
                    className="items-end"
                    onValueChange={value => setChapterToUse(value as "current" | "previous" | "custom")}
                  >
                    <TabsList>
                      <TabsTrigger value="current">
                        Current
                        {currentChapter && (
                          <span className="text-xs text-muted-foreground">({currentChapter.title})</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="previous">
                        Previous
                        {previousChapter && (
                          <span className="text-xs text-muted-foreground">({previousChapter.title})</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {chapterToUse === "custom" && (
                <>
                  <Separator />

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <Label htmlFor="option-one">Select chapter</Label>

                    <div className="items-end self-end flex justify-end">
                      <Select onValueChange={value => setCustomChapterId(value)} value={customChapterId || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {book.chapters.map(chapter => (
                            <SelectItem key={chapter.id} value={chapter.id?.toString()}>
                              {chapter.title} -{" "}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(chapter.start)} - {formatTime(chapter.end)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="submit" onClick={apply}>
              <CaptionsIcon />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  )
}
