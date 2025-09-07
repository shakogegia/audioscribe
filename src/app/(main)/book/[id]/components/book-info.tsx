"use client"
import { Hero } from "@/components/hero"
import { Badge } from "@/components/ui/badge"
import { SearchResult } from "@/types/api"
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
          <Badge variant="secondary">Cache size: {book.cacheSize.humanReadableSize}</Badge>
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
