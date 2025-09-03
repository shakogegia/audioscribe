"use client"

import { AudioFile, SearchResult } from "@/types/api"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format"
import { Bookmark, Captions, CaptionsOff, FastForward, Pause, Play, Rewind, TableOfContents } from "lucide-react"
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef, Ref } from "react"
import { twMerge } from "tailwind-merge"
// import useBookmarksStore from "@/app/book/[id]/stores/bookmarks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BookCaptions } from "./book-captions"
import useBookmarksStore from "@/stores/bookmarks"

interface BookPlayerProps {
  book: SearchResult
  files: AudioFile[]
  className?: string
  controls: "full" | "compact"
}

export interface BookPlayerRef {
  play: (time?: number) => void
  getCurrentTime: () => number
}

function BookPlayerComponent({ book, files, className, controls }: BookPlayerProps, ref: Ref<BookPlayerRef>) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [fileCurrentTime, setFileCurrentTime] = useState(0)
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null)
  const [showCaptions, setShowCaptions] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // add bookmarks store
  const addBookmark = useBookmarksStore(state => state.add)

  useImperativeHandle(ref, () => ({ play, getCurrentTime }))

  function getCurrentTime() {
    return totalCurrentTime
  }

  function play(time?: number) {
    if (time) {
      seekToTime(time)
    }
    setIsPlaying(true)
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play()
    }
  }

  // Calculate total book duration and current total progress
  const totalDuration = files.reduce((total, file) => total + file.duration, 0)
  const totalCurrentTime =
    files.slice(0, currentFileIndex).reduce((total, file) => total + file.duration, 0) + fileCurrentTime

  const currentFile = files[currentFileIndex]

  const findFileByTime = useCallback(
    (startTime: number) => {
      const file = files.find(file => startTime >= file.start && startTime < file.start + file.duration)

      if (!file) {
        const lastFile = files[files.length - 1]
        return { fileIndex: files.length - 1, fileTime: lastFile.duration, fileName: lastFile.fileName }
      }

      const fileIndex = files.findIndex(x => x.ino === file.ino)

      return { fileIndex, fileTime: startTime - file.start, fileName: file.fileName }
    },
    [files]
  )

  // Load current file
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = `/api/book/${book.id}/stream?time=${files[currentFileIndex].start}`

    audio.load()
  }, [currentFileIndex, book.id, files])

  // Handle pending seek after file loads
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || pendingSeekTime === null) return

    const handleCanPlay = () => {
      audio.currentTime = pendingSeekTime
      setFileCurrentTime(pendingSeekTime)
      setPendingSeekTime(null)

      // Resume playing if it was playing before the seek
      if (isPlaying) {
        audio.play().catch(console.error)
      }
    }

    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [pendingSeekTime, isPlaying])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setFileCurrentTime(audio.currentTime)
    }

    const updateDuration = () => {
      // Duration is already known from file metadata
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Auto-advance to next file if available
      if (currentFileIndex < files.length - 1) {
        setCurrentFileIndex(prev => prev + 1)
        setFileCurrentTime(0)
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentFileIndex, currentFile, files.length])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
    }
  }

  const rewind = () => {
    const currentTotalTime =
      files.slice(0, currentFileIndex).reduce((total, file) => total + file.duration, 0) + fileCurrentTime
    const newTotalTime = Math.max(0, currentTotalTime - 10)
    seekToTime(newTotalTime)
  }

  const forward = () => {
    const currentTotalTime =
      files.slice(0, currentFileIndex).reduce((total, file) => total + file.duration, 0) + fileCurrentTime
    const newTotalTime = Math.min(totalDuration, currentTotalTime + 10)
    seekToTime(newTotalTime)
  }

  const seekToTime = (targetTime: number) => {
    const { fileIndex, fileTime } = findFileByTime(targetTime)

    if (fileIndex !== currentFileIndex) {
      // Store the target time to set after the new file loads
      setPendingSeekTime(fileTime)
      setCurrentFileIndex(fileIndex)
    } else {
      // Same file, seek immediately
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = fileTime
        setFileCurrentTime(fileTime)
      }
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const progressPercent = clickX / rect.width
    const targetTime = progressPercent * totalDuration
    seekToTime(targetTime)
  }

  function addBookmarkAtCurrentTime() {
    addBookmark({
      libraryItemId: book.id,
      title: book.title,
      time: totalCurrentTime,
      fileStartTime: fileCurrentTime,
      createdAt: Date.now(),
    })
  }

  if (!currentFile) {
    return (
      <div className={twMerge("flex flex-col gap-4", className)}>
        <p className="text-sm text-muted-foreground">No audio files available</p>
      </div>
    )
  }

  /**
   * Skip starting/zero (Opening) chapter
   */
  const chapters = book.chapters.filter(chapter => chapter.start > 0)

  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <audio ref={audioRef} preload="metadata" />

      {/* Progress bar for entire book */}
      <div className="w-full flex items-start gap-2">
        <div className="w-full flex flex-col gap-1">
          <div
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-300 transition-colors relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-black dark:bg-white transition-all duration-100"
              style={{ width: `${(totalCurrentTime / totalDuration) * 100}%` }}
            />

            {book.bookmarks.map(bookmark => (
              <div
                key={bookmark.time}
                className="h-2 w-px bg-amber-500 absolute -top-2 transition-all hover:scale-150 hover:-top-2.5 group"
                style={{ left: `${(bookmark.time / totalDuration) * 100}%` }}
              >
                <Tooltip key={bookmark.time}>
                  <TooltipTrigger asChild>
                    <div className="h-full w-[9px] -ml-[4px] block" onClick={() => play(bookmark.time)}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-4 h-4" /> {formatTime(bookmark.time)} - {bookmark.title}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}

            {chapters.map(chapter => (
              <div
                key={chapter.start}
                className="h-2 w-px bg-black dark:bg-neutral-200 absolute -top-2 transition-all hover:scale-150 hover:-top-2.5 group"
                style={{ left: `${(chapter.start / totalDuration) * 100}%` }}
              >
                <Tooltip key={chapter.start}>
                  <TooltipTrigger asChild>
                    <div className="h-full w-[9px] -ml-[4px] block" onClick={() => play(chapter.start)}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <TableOfContents className="w-4 h-4" /> {formatTime(chapter.start)} - {chapter.title}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{formatTime(totalCurrentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {controls === "compact" && (
          <div className="flex items-center gap-1 -mt-0.5">
            <div onClick={togglePlayPause}>
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </div>
          </div>
        )}
      </div>

      {showCaptions && <BookCaptions book={book} files={files} time={totalCurrentTime} />}

      {controls === "full" && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button onClick={togglePlayPause} variant="outline" size="icon" className="w-10">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={rewind} variant="outline" size="icon" className="w-10">
                  <Rewind className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rewind 10 seconds</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={forward} variant="outline" size="icon" className="w-10">
                  <FastForward className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward 10 seconds</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="w-10" onClick={() => setShowCaptions(!showCaptions)}>
                  {showCaptions ? <CaptionsOff className="w-5 h-5" /> : <Captions className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle captions</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="w-10" onClick={addBookmarkAtCurrentTime}>
                  <Bookmark className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new bookmark at the current time</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}

export const BookPlayer = forwardRef(BookPlayerComponent)
