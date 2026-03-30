"use client"
import BookList from "@/components/book-list"
import { BookListSkeleton } from "@/components/book-list-skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { SearchResult } from "@/types/api"
import { HeartIcon } from "lucide-react"
import useSWR from "swr"

export function Favorites() {
  const { data, error, isLoading } = useSWR<SearchResult[]>(`/api/favorites?limit=20`, {
    revalidateOnFocus: true,
  })

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && <BookListSkeleton />}

        {error && (
          <div className="flex items-center justify-center p-8 text-sm text-red-500">
            <span>Error fetching favorites. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HeartIcon />
              </EmptyMedia>
              <EmptyTitle>No favorites</EmptyTitle>
              <EmptyDescription>Books you mark as favorite will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {data && data.length > 0 && <BookList books={data} />}
      </div>
    </div>
  )
}
