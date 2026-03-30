"use client"
import BookList from "@/components/book-list"
import { Pagination } from "@/components/pagination"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select"
import { SearchResult } from "@/types/api"
import { Loader2, SearchIcon, XIcon } from "lucide-react"
import { useQueryState } from "nuqs"
import { Suspense, useState } from "react"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"

type Props = {
  libraries: Library[]
}

type Library = {
  id: string
  name: string
}

function HomeContent({ libraries }: Props) {
  const [libraryId, setLibraryId] = useQueryState("libraryId", { defaultValue: libraries[0].id })
  const [page, setPage] = useQueryState("page", { defaultValue: "1" })
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(searchQuery)

  const isSearching = searchQuery.length > 0

  // Convert 1-indexed URL to 0-indexed API
  const apiPage = Math.max(0, parseInt(page) - 1)

  const { data: libraryData, error: libraryError, isLoading: libraryLoading } = useSWR<{
    books: SearchResult[]
    total: number
    page: number
    limit: number
  }>(
    !isSearching ? `/api/library/${libraryId}?page=${apiPage}` : null,
    { revalidateOnFocus: false, refreshInterval: 0 }
  )

  const { data: searchData, error: searchError, isLoading: searchLoading } = useSWR<SearchResult[]>(
    isSearching ? `/api/search?q=${encodeURIComponent(searchQuery)}&libraryId=${libraryId}&limit=20` : null,
    { revalidateOnFocus: false, refreshInterval: 0 }
  )

  const handleLibraryChange = (newLibraryId: string) => {
    setLibraryId(newLibraryId)
    setPage("1")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(inputValue.trim())
    setPage("1")
  }

  const clearSearch = () => {
    setInputValue("")
    setSearchQuery("")
    setPage("1")
  }

  const isLoading = isSearching ? searchLoading : libraryLoading
  const error = isSearching ? searchError : libraryError
  const books = isSearching ? searchData : libraryData?.books

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-4xl">
        <Select value={libraryId} onValueChange={handleLibraryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select a library" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Libraries</SelectLabel>
              {libraries.map(library => (
                <SelectItem key={library.id} value={library.id}>
                  {library.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <form onSubmit={handleSearch} className="relative w-full sm:w-[250px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search books..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>{isSearching ? "Searching..." : "Loading..."}</span>
          </div>
        )}

        {error && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", "text-red-500")}>
            <span>Error fetching books. Please try again.</span>
          </div>
        )}

        {books && books.length === 0 && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <span>{isSearching ? `No books found for "${searchQuery}"` : "No book found"}</span>
          </div>
        )}

        {books && books.length > 0 && (
          <>
            <BookList books={books} />

            {!isSearching && (
              <Pagination
                total={libraryData?.total ?? 0}
                page={parseInt(page)}
                limit={libraryData?.limit ?? 1}
                onPageChange={p => setPage(p.toString())}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function HomeFallback() {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
    </div>
  )
}

export function Home({ libraries }: Props) {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent libraries={libraries} />
    </Suspense>
  )
}
