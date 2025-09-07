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
            <TabsTrigger value="/setup/audiobookshelf">ABS</TabsTrigger>
            <TabsTrigger value="/setup/llm">LLM</TabsTrigger>
            <TabsTrigger value="/setup/asr">ASR</TabsTrigger>
            <TabsTrigger value="/setup/embedding">Embedding</TabsTrigger>
            <TabsTrigger value="/jobs">Jobs</TabsTrigger>
            <TabsTrigger value="/cache">Cache</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full">{children}</div>
    </div>
  )
}
