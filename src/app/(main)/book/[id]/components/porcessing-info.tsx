import { SearchResult } from "@/types/api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CircleCheckIcon, CircleDashedIcon, InfoIcon } from "lucide-react"

export function ProcessingInfo({ book }: { book: SearchResult }) {
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
          <p className="text-sm font-medium">Steps to process book:</p>

          <div className="[&_div]:border-transparent border rounded-lg">
            <Alert>
              <CircleCheckIcon />
              <AlertTitle>Step 1: Download book</AlertTitle>
              <AlertDescription>
                Download book from Audiobookshelf.
                <br />
                This may take a few seconds if Audiobookshelf is locally hosted.
              </AlertDescription>
            </Alert>

            <Separator />

            <Alert>
              <CircleDashedIcon />
              <AlertTitle>Step 2: Transcript book</AlertTitle>
              <AlertDescription>
                Transcribe the whole book and save the transcript to the database.
                <br />
                This may take a few minutes depending on the size of the book and the model used.
              </AlertDescription>
            </Alert>

            <Separator />

            <Alert>
              <CircleDashedIcon />
              <AlertTitle>Step 3: Vectorize book</AlertTitle>
              <AlertDescription>
                Vectorize the book and save the chunks to the vector database. This will allow you to ask questions
                about the book.
                <br />
                This may take a few minutes depending on the size of the book.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
