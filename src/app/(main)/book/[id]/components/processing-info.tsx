import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Book, BookSetupProgress } from "@prisma/client"
import axios from "axios"
import { CircleCheckIcon, CircleDashedIcon, CircleXIcon, InfoIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import { Progress } from "@/components/ui/progress"

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
  const hasFailed = data?.stages.some(s => s.status === "failed")

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
  const completedStages = data?.stages.filter(s => s.status === "completed")
  const failedStages = data?.stages.filter(s => s.status === "failed")

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
          {!data?.progress ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">Steps to process book:</p>
              <div className="[&_div]:border-transparent border rounded-lg overflow-hidden">
                <Stage
                  title="Step 1: Download"
                  className="rounded-b-none"
                  isRunning={runningStage === "download"}
                  isCompleted={completedStages?.some(s => s.stage === "download") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "download") ?? false}
                  progress={data?.stages?.find(s => s.stage === "download")?.progress}
                >
                  Download book from Audiobookshelf and save it to the local cache folder.
                  <br />
                  Fastest stage, can be completed in a few seconds if Audiobookshelf is locally hosted.
                </Stage>
                <Separator />
                <Stage
                  title="Step 2: Transcript"
                  className="rounded-none"
                  isRunning={runningStage === "transcribe"}
                  isCompleted={completedStages?.some(s => s.stage === "transcribe") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "transcribe") ?? false}
                  progress={data?.stages?.find(s => s.stage === "transcribe")?.progress}
                >
                  <p>
                    Transcribe the whole book using <span className="font-medium inline">{data?.progress?.model}</span>{" "}
                    model and save the transcript to the database.
                    <br />
                    Slowest stage, depending on the size of the book and the model used.
                  </p>
                </Stage>
                <Separator />
                <Stage
                  title="Step 3: Vectorize"
                  className="rounded-t-none"
                  isRunning={runningStage === "vectorize"}
                  isCompleted={completedStages?.some(s => s.stage === "vectorize") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "vectorize") ?? false}
                  progress={data?.stages?.find(s => s.stage === "vectorize")?.progress}
                >
                  Vectorize the book and save the chunks to the vector database. This will allow you to ask questions
                  about the book.
                  <br />
                  Second fastest stage, can be completed in a max of few minutes.
                </Stage>
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
  className: string
  progress?: number
}
export function Stage({ title, isRunning, isCompleted, isFailed, children, className, progress }: StageProps) {
  return (
    <Alert className={twMerge("rounded-b-none", className)} variant={isFailed ? "destructive" : "default"}>
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
        {Boolean(progress) && isRunning && <Progress value={progress} />}
      </AlertDescription>
    </Alert>
  )
}
