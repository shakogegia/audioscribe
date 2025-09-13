"use client"
import BookCover from "@/components/book-cover"
import { BookOptionsDialog, BookOptionTab } from "@/components/dialogs/book-options-dialog"
import Favorite from "@/components/favorite"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { SearchResult } from "@/types/api"
import { AudioLinesIcon } from "lucide-react"

interface BookProps {
  book: SearchResult
}

export default function BookInfo({ book }: BookProps) {
  return (
    <Hero
      title={book.title}
      description={[book.authors.join(", ")]}
      content={
        <div className="flex items-center gap-2">
          <Favorite id={book.id} defaultFavorite={book.favorite} />
          <BookOptionsDialog
            title="Book Options"
            book={book}
            tabs={[BookOptionTab.Setup, BookOptionTab.Export, BookOptionTab.Import, BookOptionTab.Remove]}
          >
            <Button variant="outline" size="sm">
              <AudioLinesIcon className="w-4 h-4" />
              Options
            </Button>
          </BookOptionsDialog>
        </div>
      }
      icon={
        <BookCover
          src={book.coverPath ?? ""}
          alt={book.title}
          className="w-32 h-32 object-cover rounded-md shadow-md"
          size={128}
        />
      }
    />
  )
}
