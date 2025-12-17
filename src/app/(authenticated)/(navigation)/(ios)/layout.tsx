"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"

type Props = Readonly<{
  children: React.ReactNode
}>

export default function SetupLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function onValueChange(value: string) {
    router.push(value)
  }

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="w-fit mx-auto">
        <Tabs defaultValue={pathname} onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="/ios/shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="/ios/endpoints">Endpoints</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full">{children}</div>
    </div>
  )
}
