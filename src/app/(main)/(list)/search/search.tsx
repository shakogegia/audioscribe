"use client"
import BookList from "@/components/book-list"
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
import { useForm } from "react-hook-form"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import z from "zod"

type Props = {
  libraries: Library[]
}

type Library = {
  id: string
  name: string
}

const formSchema = z.object({
  query: z.string(),
  libraryId: z.string(),
})

export function Search({ libraries }: Props) {
  const [searchQuery, setSearchQuery] = useQueryState("q")
  const [libraryId, setLibraryId] = useQueryState("libraryId")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: searchQuery ?? "", libraryId: libraryId ?? libraries[0].id },
  })

  const { data, error, isLoading } = useSWR<SearchResult[]>(
    searchQuery && libraryId
      ? `/api/search?q=${encodeURIComponent(searchQuery)}&libraryId=${libraryId}&limit=20`
      : null,
    { refreshInterval: 0, revalidateOnFocus: true }
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.query) {
      setSearchQuery(values.query)
    }
    if (values.libraryId) {
      setLibraryId(values.libraryId)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
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
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", "text-red-500")}>
            <span>Error searching books. Please try again.</span>
          </div>
        )}

        {data && data.length === 0 && (
          <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600")}>
            <span>No books found for &quot;{searchQuery}&quot;</span>
          </div>
        )}

        {data && data.length > 0 && <BookList books={data} />}
      </div>
    </div>
  )
}
