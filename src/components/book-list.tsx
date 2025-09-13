"use client"
import { BookOptionsDialog, BookOptionTab } from "@/components/dialogs/book-options-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/format"
import { SearchResult } from "@/types/api"
import { AudioLinesIcon, BookOpenCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import BookCover from "./book-cover"

type Props = {
  books: SearchResult[]
}

type Stage = "pending" | "downloading" | "transcribing" | "vectorizing" | "completed" | "failed"
type StageVariant = "default" | "secondary" | "destructive" | "outline"

const STAGES: Record<Stage, { variant: StageVariant; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  downloading: { variant: "outline", label: "Downloading" },
  transcribing: { variant: "outline", label: "Transcribing" },
  vectorizing: { variant: "outline", label: "Vectorizing" },
  completed: { variant: "default", label: "Ready" },
  failed: { variant: "destructive", label: "Failed" },
}

export default function BookList({ books }: Props) {
  return books.map(book => (
    <div key={book.id} className="flex flex-col sm:flex-row gap-2 items-center border rounded-lg p-4">
      <BookCover src={book.coverPath} size={64} />
      <div className="flex flex-col flex-1 text-center sm:text-left">
        <h3 className="text-md font-semibold">{book.title}</h3>
        <div className="flex gap-2 justify-center sm:justify-start">
          <span className="text-sm text-neutral-500">{book.authors.join(", ")}</span>
        </div>
        <div className="flex gap-2 mt-1 justify-center sm:justify-start">
          {/* {book.progress && (
            <Badge variant={STAGES[book.progress.stage].variant}>{STAGES[book.progress.stage].label}</Badge>
          )} */}

          {book.setup && <Badge variant={STAGES.completed.variant}>{STAGES.completed.label}</Badge>}

          {book.model && <Badge variant="secondary">{book.model}</Badge>}

          <Badge variant="secondary">{formatDuration(book.duration)}</Badge>
        </div>
      </div>

      {book.progress ? (
        <Link href={`/book/${book.id}`}>
          <Button size="default" variant="default">
            <BookOpenCheck className="w-4 h-4" />
            Open
          </Button>
        </Link>
      ) : (
        <BookOptionsDialog book={book} tabs={[BookOptionTab.Setup, BookOptionTab.Import]}>
          <Button size="default" variant="outline">
            <AudioLinesIcon className="w-4 h-4" />
            Setup
          </Button>
        </BookOptionsDialog>
      )}
    </div>
  ))
}
