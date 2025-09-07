"use client"
import { WhisperModel } from "@/ai/transcription/types/transription"
import BookIcon from "@/components/book-icon"
import GradientIcon from "@/components/gradient-icon"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchResult } from "@/types/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search as SearchIcon } from "lucide-react"
import { useQueryState } from "nuqs"
import { Suspense, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useMount } from "react-use"
import SiriWave from "siriwave"
import useSWR from "swr"
import z from "zod"
import SearchResults from "./search-results"
import SearchStatus from "./status"

type Props = {
  libraries: Library[]
  setupBook: (bookId: string, model: WhisperModel) => void
}

type Library = {
  id: string
  name: string
}

const formSchema = z.object({
  query: z.string(),
  libraryId: z.string(),
})

function SearchPageContent({ libraries, setupBook }: Props) {
  const [searchQuery, setSearchQuery] = useQueryState("q")
  const [libraryId, setLibraryId] = useQueryState("libraryId")
  const siriWaveRef = useRef<SiriWave | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: searchQuery ?? "", libraryId: libraryId ?? libraries[0].id },
  })

  const { data, error, isLoading } = useSWR<SearchResult[]>(
    searchQuery && libraryId ? `/api/search?q=${encodeURIComponent(searchQuery)}&libraryId=${libraryId}&limit=20` : null
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.query) {
      setSearchQuery(values.query)
    }
    if (values.libraryId) {
      setLibraryId(values.libraryId)
    }
  }

  useEffect(() => {
    siriWaveRef.current = new SiriWave({
      container: document.getElementById("siri-container") as HTMLElement,
      width: 128,
      height: 128,
      speed: 0.05,
    })
    return () => {
      siriWaveRef.current?.dispose()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 w-full my-10 px-4">
      <Hero
        title="AudioScribe"
        description={["Add intelligent bookmarks and transcriptions", "to enhance your audiobook experience."]}
        icon={<BookIcon icon={<div id="siri-container"></div>} />}
      />

      {/* Search */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col sm:flex-row w-full max-w-xl items-center gap-2"
        >
          <FormField
            control={form.control}
            name="libraryId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input type="text" placeholder="Example: Red Rising" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" variant="outline">
            <SearchIcon className="w-4 h-4" />
            Search
          </Button>
        </form>
      </Form>

      {/* Results */}
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        {isLoading && searchQuery && (
          <SearchStatus>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Searching...</span>
          </SearchStatus>
        )}

        {error && (
          <SearchStatus className="text-red-500">
            <span>Error searching books. Please try again.</span>
          </SearchStatus>
        )}

        {data && data.length === 0 && (
          <SearchStatus>
            <span>No books found for &quot;{searchQuery}&quot;</span>
          </SearchStatus>
        )}

        {data && data.length > 0 && <SearchResults books={data} setupBook={setupBook} />}
      </div>
    </div>
  )
}

export function Search({ libraries, setupBook }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-8 w-full min-h-full py-10">
          <Hero
            title="Audiobook Search"
            description={["Search for audiobooks in your library.", "Use book titles to search."]}
            icon={
              <GradientIcon
                gradient="from-blue-600 to-pink-400"
                icon={<SearchIcon className="w-10 h-10 text-white" />}
              />
            }
          />
          <SearchStatus>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Loading search...</span>
          </SearchStatus>
        </div>
      }
    >
      <SearchPageContent libraries={libraries} setupBook={setupBook} />
    </Suspense>
  )
}
