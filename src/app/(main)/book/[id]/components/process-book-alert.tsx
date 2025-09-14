import { BookOptionsDialog, BookOptionTab } from "@/components/dialogs/book-options-dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SearchResult } from "@/types/api"
import { AudioLinesIcon, InfoIcon } from "lucide-react"

export function ProcessBookAlert({ book }: { book: SearchResult }) {
  return (
    <div className="mx-auto max-w-xl w-full grid gap-8 items-center ">
      <Alert>
        <InfoIcon />
        <AlertTitle>Book has not been processed</AlertTitle>
        <AlertDescription>
          To use this book, you need to process it first. Press &quot;Start Processing&quot; button and process the book
          either by transcribing or importing a transcript.
        </AlertDescription>
      </Alert>

      <BookOptionsDialog title="Book Options" book={book} tabs={[BookOptionTab.Setup, BookOptionTab.Import]}>
        <Button variant="default" size="sm" className="w-full">
          <AudioLinesIcon className="w-4 h-4" />
          Start Processing
        </Button>
      </BookOptionsDialog>
    </div>
  )
}
