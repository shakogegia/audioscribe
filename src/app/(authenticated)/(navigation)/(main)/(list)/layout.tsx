"use client"
import { Hero } from "@/components/hero"
import Logo from "@/components/logo"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpenCheckIcon,
  CheckIcon,
  CircleDashedIcon,
  HomeIcon,
  Loader2Icon,
  SearchIcon,
  StarIcon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

type Props = Readonly<{
  children: React.ReactNode
}>

export default function ListLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function onValueChange(value: string) {
    router.push(value)
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full my-10 px-4">
      <Hero
        title="AudioScribe"
        description={["Add intelligent bookmarks and transcriptions", "to enhance your audiobook experience."]}
        icon={<Logo size={128} />}
      />
      <div className="w-full flex flex-col gap-10">
        <div className="w-fit mx-auto">
          <Tabs key={pathname} defaultValue={pathname} onValueChange={onValueChange}>
            <TabsList>
              <TabsTrigger value="/home">
                <HomeIcon />
                Home
              </TabsTrigger>
              <TabsTrigger value="/search">
                <SearchIcon />
                Search
              </TabsTrigger>
              <TabsTrigger value="/favorites">
                <StarIcon />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="/processed">
                <BookOpenCheckIcon />
                Processed
              </TabsTrigger>
              <TabsTrigger value="/processing">
                <CircleDashedIcon />
                Processing
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
