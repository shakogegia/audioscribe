"use client"
import BookList from "@/components/book-list"
import { BookListSkeleton } from "@/components/book-list-skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ProcessingResponse } from "@/app/api/processing/route"
import { AudioLinesIcon } from "lucide-react"
import useSWR from "swr"

export function Processing() {
  const { data, error, isLoading } = useSWR<ProcessingResponse>(`/api/processing?limit=20`, {
    revalidateOnFocus: true,
  })

  const isEmpty = data && data.running.length === 0 && data.queued.length === 0

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && <BookListSkeleton />}

        {error && (
          <div className="flex items-center justify-center p-8 text-sm text-red-500">
            <span>Error fetching processing books. Please try again.</span>
          </div>
        )}

        {isEmpty && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AudioLinesIcon />
              </EmptyMedia>
              <EmptyTitle>No processing books</EmptyTitle>
              <EmptyDescription>Books being transcribed will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {data && data.running.length > 0 && (
          <BookList books={data.running} />
        )}

        {data && data.queued.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Queue</h2>
            <BookList books={data.queued} />
          </div>
        )}
      </div>
    </div>
  )
}
