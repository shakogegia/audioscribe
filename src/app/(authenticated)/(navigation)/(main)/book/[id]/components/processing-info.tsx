import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import axios from "axios"
import { CircleCheckIcon, CircleDashedIcon, CircleXIcon, InfoIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react"
import { Fragment, useEffect } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import { Progress } from "@/components/ui/progress"
import { Book, BookSetupProgress, BookSetupStage, BookSetupStatus } from "../../../../../../../../generated/prisma"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ProcessingInfoProps = {
  book: SearchResult
  revalidate: (id: string) => void
}

type ProgressResponse = {
  stages: BookSetupProgress[]
  currentStage: BookSetupProgress | null
  progress: BookSetupProgress | null // Legacy support
  book: Book | null
}

export function ProcessingInfo({ book, revalidate }: ProcessingInfoProps) {
  const { data } = useSWR<ProgressResponse>(`/api/book/${book.id}/setup/progress`, {
    refreshInterval: 1000,
    revalidateOnFocus: false,
  })

  // const allCompleted = data?.stages.every(s => s.status === "completed")
  const hasFailed = data?.stages.some(s => s.status === BookSetupStatus.Failed)

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

  const runningStage = data?.currentStage?.stage
  const completedStages = data?.stages.filter(s => s.status === BookSetupStatus.Completed)
  const failedStages = data?.stages.filter(s => s.status === BookSetupStatus.Failed)

  async function retry() {
    if (!book.model) {
      toast.error("Book model is not set")
      return
    }

    toast.loading("Sending a request", { id: "setup-book" })
    await axios.post(`/api/book/${book.id}/setup`, {
      model: book.model,
    })
    toast.success("Request sent", { id: "setup-book" })
  }

  const stages = [
    {
      stage: BookSetupStage.Download,
      title: "Download",
      description: `Download book from Audiobookshelf and save it to the local cache folder.
                  <br />
                  Fastest stage, can be completed in a few seconds if Audiobookshelf is locally hosted.`,
    },
    {
      stage: BookSetupStage.ProcessAudio,
      title: "Process Audio",
      description: `Process the audio file to prepare it for transcription, stitching multiple audio files if needed. and
                  converting to WAV format.
                  <br />
                  Can be completed in a few minutes, depending on the size of the book and the number of audio files.`,
    },
    {
      stage: BookSetupStage.Transcribe,
      title: "Transcribe",
      description: `Transcribe the whole book using <span className="font-medium inline">${
        data?.book?.model || "Unknown"
      }</span> model and save the transcript to the database.
                  <br />
                  Slowest stage, depending on the size of the book and the model used.`,
    },
    {
      stage: BookSetupStage.Vectorize,
      title: "Vectorize",
      description: `Vectorize the book and save the chunks to the vector database. This will allow you to ask questions
                  about the book.
                  <br />
                  Second fastest stage, can be completed in a max of few minutes.`,
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
                      isRunning={runningStage === stage.stage}
                      isCompleted={completedStages?.some(s => s.stage === stage.stage) ?? false}
                      isFailed={failedStages?.some(s => s.stage === stage.stage) ?? false}
                      progress={data?.stages?.find(s => s.stage === stage.stage)?.progress}
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
}
export function Stage({ title, isRunning, isCompleted, isFailed, children, progress, isFirst, isLast }: StageProps) {
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
            <TooltipContent>Progress: {progress}%</TooltipContent>
          </Tooltip>
        )}
      </AlertDescription>
    </Alert>
  )
}
