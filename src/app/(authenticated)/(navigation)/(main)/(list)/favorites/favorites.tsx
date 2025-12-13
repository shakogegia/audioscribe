"use client"
import BookList from "@/components/book-list"
import { SearchResult } from "@/types/api"
import { Loader2 } from "lucide-react"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"

export function Favorites() {
  const { data, error, isLoading } = useSWR<SearchResult[]>(`/api/favorites?limit=20`, {
    revalidateOnFocus: true,
  })

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Results */}
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", "text-red-500")}>
            <span>Error fetching favorites. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <span>No favorites found</span>
          </div>
        )}

        {data && data.length > 0 && <BookList books={data} />}
      </div>
    </div>
  )
}
