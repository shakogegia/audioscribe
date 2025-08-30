"use client";
import GradientIcon from "@/components/gradient-icon";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchResult } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import z from "zod";
import SearchResults from "./results";
import SearchStatus from "./status";

const formSchema = z.object({
  query: z.string().optional(),
});

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useQueryState("q");
  const [libraryId] = useState<string>("47c4480b-cece-40db-8c15-7b3049686814"); // Default library ID

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: searchQuery ?? "" },
  });

  const { data, error, isLoading } = useSWR<SearchResult[]>(
    searchQuery ? `/api/search?q=${encodeURIComponent(searchQuery)}&libraryId=${libraryId}&limit=20` : null
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.query) {
      setSearchQuery(values.query);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full py-10">
      <Hero
        title="Audiobook Search"
        description={["Search for audiobooks in your library.", "Use book titles to search."]}
        icon={<GradientIcon gradient="from-blue-600 to-pink-400" icon={<Search className="w-10 h-10 text-white" />} />}
      />

      {/* Search */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-sm items-center gap-2">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input type="text" placeholder="Example: Red Rising" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="outline">
            <Search className="w-4 h-4" />
            Search
          </Button>
        </form>
      </Form>

      {/* Results */}
      <div className="flex flex-col gap-4 w-full max-w-4xl px-4">
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

        {data && data.length > 0 && <SearchResults books={data} />}
      </div>
    </div>
  );
}
