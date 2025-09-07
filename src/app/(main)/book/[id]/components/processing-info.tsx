import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CircleCheckIcon, CircleDashedIcon, InfoIcon, Loader2Icon } from "lucide-react"
import useSWR from "swr"
import { BookSetupProgress } from "@prisma/client"
import { useEffect } from "react"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

type ProcessingInfoProps = {
  book: SearchResult
  revalidate: (id: string) => void
}

const STAGES: Record<string, number> = {
  pending: 0,
  downloading: 1,
  transcribing: 2,
  vectorizing: 3,
  completed: 4,
  failed: 5,
}

export function ProcessingInfo({ book, revalidate }: ProcessingInfoProps) {
  const { data } = useSWR<{ progress: BookSetupProgress }>(`/api/book/${book.id}/setup/progress`)

  useEffect(() => {
    if (data?.progress?.stage === "completed") {
      toast.success("Book is ready")
      revalidate(book.id)
    } else if (data?.progress?.stage === "failed") {
      toast.error("Book setup failed")
    } else if (data?.progress?.stage === "transcribing") {
      toast.info("Book download is complete")
    } else if (data?.progress?.stage === "vectorizing") {
      toast.info("Book transcription is complete")
    }
  }, [data?.progress?.stage, revalidate, book.id])

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
                <Alert className="rounded-b-none">
                  {STAGES[data.progress.stage] > 1 ? (
                    <CircleCheckIcon />
                  ) : (
                    <CircleDashedIcon className={twMerge(data.progress.stage === "downloading" && "animate-spin")} />
                  )}
                  <AlertTitle>Step 1: Download book</AlertTitle>
                  <AlertDescription>
                    Download book from Audiobookshelf and save it to the local cache folder.
                    <br />
                    Takes a few seconds up to a minute if Audiobookshelf is locally hosted.
                  </AlertDescription>
                </Alert>

                <Separator />

                <Alert className="rounded-none">
                  {STAGES[data.progress.stage] > 2 ? (
                    <CircleCheckIcon />
                  ) : (
                    <CircleDashedIcon className={twMerge(data.progress.stage === "transcribing" && "animate-spin")} />
                  )}
                  <AlertTitle>Step 2: Transcript book</AlertTitle>
                  <AlertDescription>
                    <p>
                      Transcribe the whole book using{" "}
                      <span className="font-medium inline">{data?.progress?.model}</span> model and save the transcript
                      to the database.
                      <br />
                      Takes a few minutes depending on the size of the book and the model used.
                    </p>
                  </AlertDescription>
                </Alert>

                <Separator />

                <Alert className="rounded-t-none">
                  {STAGES[data.progress.stage] > 3 ? (
                    <CircleCheckIcon />
                  ) : (
                    <CircleDashedIcon className={twMerge(data.progress.stage === "vectorizing" && "animate-spin")} />
                  )}
                  <AlertTitle>Step 3: Vectorize book</AlertTitle>
                  <AlertDescription>
                    Vectorize the book and save the chunks to the vector database. This will allow you to ask questions
                    about the book.
                    <br />
                    Takes a few minutes depending on the size of the book.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
