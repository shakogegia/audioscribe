import { load } from "@/lib/config"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type Props = Readonly<{
  children: React.ReactNode
}>

export default async function MainLayout({ children }: Props) {
  const config = await load()

  const isAudiobookshelfConfigured = Object.values(config.audiobookshelf).every(value => value !== null)
  if (!isAudiobookshelfConfigured) {
    return redirect("/setup/audiobookshelf")
  }

  const aiProviders = Object.values(config.aiProviders).filter(provider => provider.enabled)
  if (aiProviders.length === 0) {
    return redirect("/setup/llm")
  }

  const modelSetting = await prisma.setting.findUnique({ where: { key: "ai.model" } })
  if (!modelSetting) {
    return redirect("/setup/llm")
  }

  return children
}
