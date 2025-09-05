"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchResult } from "@/types/api"
import { formatDuration } from "@/lib/format"
import { BookOpenCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function SearchResults({ books }: { books: SearchResult[] }) {
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
          {book.cacheSize.size > 0 && <Badge variant="default">Cached</Badge>}
          <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
            Transcripted
          </Badge>
          <Badge variant="secondary">{book.bookmarks.length} Bookmarks</Badge>
          <Badge variant="secondary">{formatDuration(book.duration)}</Badge>
        </div>
      </div>
      <Link href={`/book/${book.id}`}>
        <Button variant="outline">
          <BookOpenCheck className="w-4 h-4" />
          Open
        </Button>
      </Link>
    </div>
  ))
}
