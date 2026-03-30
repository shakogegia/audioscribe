import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import axios from "axios"
import {
  BugIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
  RefreshCcwIcon,
} from "lucide-react"
import { Fragment, useEffect, useMemo } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import { Progress } from "@/components/ui/progress"
import { Book } from "../../../../../../../../generated/prisma"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ProcessingInfoProps = {
  book: SearchResult
  revalidate: (id: string) => void
}

type StageInfo = {
  stage: string
  status: string
  progress: number
  error: string | null
  startedAt: string | null
  completedAt: string | null
  totalChunks: number
  completedChunks: number
}

type ProgressResponse = {
  stages: StageInfo[]
  currentStage: StageInfo | null
  book: Book | null
}

export function ProcessingInfo({ book, revalidate }: ProcessingInfoProps) {
  const { data } = useSWR<ProgressResponse>(`/api/book/${book.id}/setup/progress`, {
    refreshInterval: 2000,
    revalidateOnFocus: false,
  })

  // const allCompleted = data?.stages.every(s => s.status === "completed")
  const hasFailed = data?.stages.some(s => s.status === "Failed")

  // TODO: use setup true
  // useEffect(() => {
  //   if (!data?.currentStage) return

  //   const currentStage = data?.currentStage

  //   if (allCompleted) {
  //     toast.success("Book is ready")
  //     revalidate(book.id)
  //   }  else if (hasFailed) {
  //     toast.error("Book setup failed")
  //   } else if (currentStage.stage === "transcribe" && currentStage.status === "running") {
  //     toast.info("Book download is complete")
  //   } else if (currentStage.stage === "vectorize" && currentStage.status === "running") {
  //     toast.info("Book transcription is complete")
  //   }
  // }, [
  //   data?.currentStage?.stage,
  //   data?.currentStage,
  //   data?.currentStage?.status,
  //   revalidate,
  //   book.id,
  //   allCompleted,
  //   hasFailed,
  // ])

  useEffect(() => {
    if (data?.book?.setup) {
      toast.success("Book is ready")
      revalidate(book.id)
    }
  }, [data?.book?.setup, revalidate, book.id])

  async function retry() {
    if (!book.model) {
      toast.error("Book model is not set")
      return
    }

    toast.loading("Retrying from failed stage...", { id: "setup-book" })
    await axios.post(`/api/book/${book.id}/setup`, {
      model: book.model,
      retry: true,
    })
    toast.success("Request sent", { id: "setup-book" })
  }

  const stages = [
    {
      stage: "Download",
      title: "Download",
      description: "Download book from Audiobookshelf and save it to the local cache.",
    },
    {
      stage: "ProcessAudio",
      title: "Process Audio",
      description: "Stitch and preprocess audio files for transcription.",
    },
    {
      stage: "Chunk",
      title: "Chunk Audio",
      description: "Split audio into chunks for resumable transcription.",
    },
    {
      stage: "Transcribe",
      title: "Transcribe",
      description: `Transcribe using <span class="font-medium">${data?.book?.model || "Unknown"}</span> model.`,
    },
    {
      stage: "Vectorize",
      title: "Vectorize",
      description: "Create embeddings for AI-powered search and chat.",
    },
  ]

  return (
    <div className="mx-auto w-full">
      <div className="grid w-full max-w-xl items-start gap-8 mx-auto">
        <Alert>
          <InfoIcon />
          <AlertTitle>Book is being processed</AlertTitle>
          <AlertDescription>
            Book is setting up and will be ready in a few minutes. <br /> You can leave this page and come back later.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          {!data ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">Steps to process book:</p>
              <div className="[&_div]:border-transparent border rounded-lg overflow-hidden">
                {stages.map((stage, index) => (
                  <Fragment key={stage.stage}>
                    <Stage
                      title={`Step ${index + 1}: ${stage.title}`}
                      isRunning={data?.currentStage?.stage === stage.stage}
                      isCompleted={data?.stages?.some(s => s.stage === stage.stage && s.status === "Completed") ?? false}
                      isFailed={data?.stages?.some(s => s.stage === stage.stage && s.status === "Failed") ?? false}
                      progress={data?.stages?.find(s => s.stage === stage.stage)?.progress}
                      startedAt={data?.stages?.find(s => s.stage === stage.stage)?.startedAt}
                      error={data?.stages?.find(s => s.stage === stage.stage)?.error}
                      totalChunks={data?.stages?.find(s => s.stage === stage.stage)?.totalChunks ?? 0}
                      completedChunks={data?.stages?.find(s => s.stage === stage.stage)?.completedChunks ?? 0}
                      isFirst={index === 0}
                      isLast={index === stages.length - 1}
                    >
                      <div dangerouslySetInnerHTML={{ __html: stage.description }} />
                    </Stage>
                    {index < stages.length - 1 && <Separator />}
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        {hasFailed && (
          <Button onClick={retry}>
            <RefreshCcwIcon className="w-4 h-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

type StageProps = {
  title: string
  isRunning: boolean
  isCompleted: boolean
  isFailed: boolean
  children: React.ReactNode
  progress?: number
  isFirst: boolean
  isLast: boolean
  startedAt?: Date | string | null
  error?: string | null
  totalChunks?: number
  completedChunks?: number
}
export function Stage({
  title,
  isRunning,
  isCompleted,
  isFailed,
  children,
  progress,
  isFirst,
  isLast,
  startedAt,
  error,
  totalChunks = 0,
  completedChunks = 0,
}: StageProps) {
  const estimated = useMemo(() => {
    if (!startedAt || !progress || progress <= 0) return null

    const now = Date.now()
    const startTime = new Date(startedAt).getTime()
    const elapsed = now - startTime

    // Calculate remaining time based on progress
    const totalEstimated = elapsed / (progress / 100)
    const remaining = Math.max(0, totalEstimated - elapsed)

    const seconds = Math.floor(remaining / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
      return `${seconds}s`
    } else if (minutes < 60) {
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else if (hours < 24) {
      const remainingMinutes = minutes % 60
      const remainingSeconds = seconds % 60
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
    } else {
      const remainingHours = hours % 24
      const remainingMinutes = minutes % 60
      const remainingSeconds = seconds % 60
      return `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`
    }
  }, [startedAt, progress])

  return (
    <Alert
      className={twMerge(
        isFirst && "rounded-b-none",
        isLast && "rounded-t-none",
        !isFirst && !isLast && "rounded-none"
      )}
      variant={isFailed ? "destructive" : "default"}
    >
      {isFailed ? (
        <CircleXIcon />
      ) : isCompleted ? (
        <CircleCheckIcon className="text-green-500!" />
      ) : (
        <CircleDashedIcon className={twMerge(isRunning && "animate-spin")} />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {children}
        {/* {progress && <p className="text-sm text-muted-foreground">Progress: {progress}%</p>} */}
        {Boolean(progress) && isRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={progress} />
            </TooltipTrigger>
            <TooltipContent>
              {progress !== undefined && <p>Progress: {progress.toFixed(2)}%</p>}
              {totalChunks > 0 && <p>Chunks: {completedChunks}/{totalChunks}</p>}
              {estimated && <p>Estimated: {estimated}</p>}
            </TooltipContent>
          </Tooltip>
        )}
        {isCompleted && totalChunks > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{totalChunks} chunks transcribed</p>
        )}

        {error && (
          <div className="text-sm font-medium text-destructive">
            <p>{error}</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
