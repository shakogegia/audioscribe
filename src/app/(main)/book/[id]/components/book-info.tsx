"use client"
import { ConfirmSetup } from "@/app/(main)/search/confirm-setup"
import { Hero } from "@/components/hero"
import { Badge } from "@/components/ui/badge"
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
          <ConfirmSetup title="Re-setup book" book={book}>
            <Button variant="outline" size="sm">
              <AudioLinesIcon className="w-4 h-4" />
              Options
            </Button>
          </ConfirmSetup>
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
