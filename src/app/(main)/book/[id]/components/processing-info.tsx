import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CircleCheckIcon, CircleDashedIcon, InfoIcon, Loader2Icon, CircleXIcon, RefreshCcwIcon } from "lucide-react"
import useSWR from "swr"
import { Book, BookSetupProgress } from "@prisma/client"
import { useEffect } from "react"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import axios from "axios"

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
  const { data } = useSWR<ProgressResponse>(`/api/book/${book.id}/setup/progress`)

  const allCompleted = data?.stages.every(s => s.status === "completed")
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
    <div>
      <div className="grid w-full max-w-xl items-start gap-8">
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
              <div className="[&_div]:border-transparent border rounded-lg">
                <Stage
                  title="Step 1: Download book"
                  className="rounded-b-none"
                  isRunning={runningStage === "download"}
                  isCompleted={completedStages?.some(s => s.stage === "download") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "download") ?? false}
                >
                  Download book from Audiobookshelf and save it to the local cache folder.
                  <br />
                  Fastest stage, can be completed in a few seconds if Audiobookshelf is locally hosted.
                </Stage>
                <Separator />
                <Stage
                  title="Step 2: Transcript book"
                  className="rounded-none"
                  isRunning={runningStage === "transcribe"}
                  isCompleted={completedStages?.some(s => s.stage === "transcribe") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "transcribe") ?? false}
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
                  title="Step 3: Vectorize book"
                  className="rounded-t-none"
                  isRunning={runningStage === "vectorize"}
                  isCompleted={completedStages?.some(s => s.stage === "vectorize") ?? false}
                  isFailed={failedStages?.some(s => s.stage === "vectorize") ?? false}
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
}
export function Stage({ title, isRunning, isCompleted, isFailed, children, className }: StageProps) {
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
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
