"use client"
import BookList from "@/components/book-list"
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
import { Loader2 } from "lucide-react"
import { useQueryState } from "nuqs"
import { Suspense } from "react"
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

  const { data, error, isLoading } = useSWR<SearchResult[]>(`/api/library/${libraryId}`, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  })

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex justify-center">
        <Select value={libraryId} onValueChange={setLibraryId}>
          <SelectTrigger>
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
      </div>

      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        )}

        {error && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", "text-red-500")}>
            <span>Error fetching books. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <span>No book found</span>
          </div>
        )}

        {data && data.length > 0 && (
          <>
            <BookList books={data} />
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
