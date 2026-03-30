"use client"
import BookList from "@/components/book-list"
import { BookListSkeleton } from "@/components/book-list-skeleton"
import BookCover from "@/components/book-cover"
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { BookBasicInfo, SearchResult } from "@/types/api"
import { ArrowDownUp, BookIcon, Loader2, SearchIcon, XIcon } from "lucide-react"
import Link from "next/link"
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

const SORT_OPTIONS = [
  { value: "addedAt-1", label: "Added (Newest)" },
  { value: "addedAt-0", label: "Added (Oldest)" },
  { value: "media.metadata.title-0", label: "Title (A-Z)" },
  { value: "media.metadata.title-1", label: "Title (Z-A)" },
  { value: "media.metadata.authorName-0", label: "Author (A-Z)" },
  { value: "media.metadata.authorName-1", label: "Author (Z-A)" },
  { value: "media.duration-1", label: "Duration (Longest)" },
  { value: "media.duration-0", label: "Duration (Shortest)" },
]

function ContinueListening({ libraryId }: { libraryId: string }) {
  const { data: books, isLoading } = useSWR<BookBasicInfo[]>(`/api/library/${libraryId}/continue-listening`, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  })

  if (isLoading || !books || books.length === 0) return null

  return (
    <div className="flex flex-col gap-3 w-full max-w-4xl">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Continue Listening</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3">
          {books.map(book => (
            <Link key={book.id} href={`/book/${book.id}`} className="shrink-0 w-[100px] group">
              <BookCover src={book.cover} size={100} />
              <p className="text-xs font-medium mt-1.5 truncate group-hover:text-primary transition-colors">
                {book.title}
              </p>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function HomeContent({ libraries }: Props) {
  const [libraryId, setLibraryId] = useQueryState("libraryId", { defaultValue: libraries[0].id })
  const [page, setPage] = useQueryState("page", { defaultValue: "1" })
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" })
  const [sortValue, setSortValue] = useQueryState("sort", { defaultValue: "addedAt-1" })
  const [inputValue, setInputValue] = useState(searchQuery)

  const isSearching = searchQuery.length > 0
  const [sortField, sortDesc] = sortValue.split("-")

  // Convert 1-indexed URL to 0-indexed API
  const apiPage = Math.max(0, parseInt(page) - 1)

  const {
    data: libraryData,
    error: libraryError,
    isLoading: libraryLoading,
  } = useSWR<{
    books: SearchResult[]
    total: number
    page: number
    limit: number
  }>(!isSearching ? `/api/library/${libraryId}?page=${apiPage}&sort=${sortField}&desc=${sortDesc}` : null, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  })

  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
  } = useSWR<SearchResult[]>(
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

  const handleSortChange = (value: string) => {
    setSortValue(value)
    setPage("1")
  }

  const isLoading = isSearching ? searchLoading : libraryLoading
  const error = isSearching ? searchError : libraryError
  const books = isSearching ? searchData : libraryData?.books

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-4xl">
        <div className="flex gap-2 w-full sm:w-auto">
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

          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <ArrowDownUp className="w-4 h-4 mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

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

      <ContinueListening libraryId={libraryId} />

      <div className="flex flex-col gap-2 w-full max-w-4xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Library</h2>
        {isLoading && <BookListSkeleton />}

        {error && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", "text-red-500")}>
            <span>Error fetching books. Please try again.</span>
          </div>
        )}

        {books && books.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {isSearching ? <SearchIcon /> : <BookIcon />}
              </EmptyMedia>
              <EmptyTitle>{isSearching ? "No results" : "No books found"}</EmptyTitle>
              <EmptyDescription>
                {isSearching ? `No books match "${searchQuery}".` : "This library has no books yet."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
