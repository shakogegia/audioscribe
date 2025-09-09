"use client"
import { Hero } from "@/components/hero"
import Logo from "@/components/logo"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
          <Tabs defaultValue={pathname} onValueChange={onValueChange}>
            <TabsList>
              <TabsTrigger value="/search">Search</TabsTrigger>
              <TabsTrigger value="/favorites">Favorites</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
