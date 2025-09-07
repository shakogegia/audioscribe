"use client"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/format"
import { SearchResult } from "@/types/api"
import { AudioLinesIcon, BookOpenCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ConfirmSetup } from "./confirm-setup"

type Props = {
  books: SearchResult[]
  setupBook: (bookId: string, model: WhisperModel) => void
}

export default function SearchResults({ books, setupBook }: Props) {
  return books.map(book => (
    <div key={book.id} className="flex gap-2 items-center border rounded-lg p-4">
      <Image
        src={book.coverPath ?? ""}
        alt="Audiobook"
        className="w-16 h-16 object-cover rounded-md"
        width={64}
        height={64}
      />
      <div className="flex flex-col flex-1">
        <h3 className="text-md font-semibold">{book.title}</h3>
        <div className="flex gap-2">
          <span className="text-sm text-neutral-500">{book.authors.join(", ")}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {book.transcribed && <Badge variant="default">Transcripted</Badge>}
          <Badge variant="secondary">{formatDuration(book.duration)}</Badge>
        </div>
      </div>

      {book.transcribed ? (
        <Link href={`/book/${book.id}`}>
          <Button variant="default">
            <BookOpenCheck className="w-4 h-4" />
            Open
          </Button>
        </Link>
      ) : (
        <ConfirmSetup onConfirm={model => setupBook(book.id, model)}>
          <Button variant="outline">
            <AudioLinesIcon className="w-4 h-4" />
            Setup
          </Button>
        </ConfirmSetup>
      )}
    </div>
  ))
}
