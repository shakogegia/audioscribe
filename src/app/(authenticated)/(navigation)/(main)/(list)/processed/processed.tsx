"use client"
import BookList from "@/components/book-list"
import { BookListSkeleton } from "@/components/book-list-skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { SearchResult } from "@/types/api"
import { BookOpenCheck } from "lucide-react"
import useSWR from "swr"

export function Processed() {
  const { data, error, isLoading } = useSWR<SearchResult[]>(`/api/processed?limit=20`, {
    revalidateOnFocus: true,
  })

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && <BookListSkeleton />}

        {error && (
          <div className="flex items-center justify-center p-8 text-sm text-red-500">
            <span>Error fetching processed books. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenCheck />
              </EmptyMedia>
              <EmptyTitle>No processed books</EmptyTitle>
              <EmptyDescription>Fully transcribed books will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {data && data.length > 0 && <BookList books={data} />}
      </div>
    </div>
  )
}
