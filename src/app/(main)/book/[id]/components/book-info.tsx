"use client"
import { BookOptionsDialog, BookOptionTab } from "@/components/dialogs/book-options-dialog"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { SearchResult } from "@/types/api"
import { AudioLinesIcon } from "lucide-react"
import Image from "next/image"

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
        <Image
          src={book.coverPath ?? ""}
          alt={book.title}
          className="w-32 h-32 object-cover rounded-md shadow-md"
          width={128}
          height={128}
        />
      }
    />
  )
}
