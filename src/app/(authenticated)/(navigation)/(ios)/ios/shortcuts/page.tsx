import { cn } from "@/lib/utils"
import { BookmarkIcon, CirclePlayIcon, CircleQuestionMarkIcon, MapIcon, PlusIcon } from "lucide-react"

export default async function ShortcutsPage() {
  return (
    <div className="w-full flex flex-col items-center gap-8 my-10 px-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Shortcuts</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Add these predefined shortcuts to your iPhone for quick AI-powered audiobook assistance—get recaps, chapter
          summaries, and context without leaving your current app.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <ShortcutCard
          title="Previously on"
          icon={CirclePlayIcon}
          colors={["to-blue-400", "from-blue-700"]}
          url="https://www.icloud.com/shortcuts/e5351e2956714c9dad1524e3ea08e446"
        />
        <ShortcutCard
          title="What just happened?"
          icon={CircleQuestionMarkIcon}
          colors={["to-purple-400", "from-purple-700"]}
          url="https://www.icloud.com/shortcuts/80ee71699bf545d99ee008da0de8be8c"
        />
        <ShortcutCard
          title="Summarize previous chapter"
          icon={BookmarkIcon}
          colors={["to-green-400", "from-green-700"]}
          url="https://www.icloud.com/shortcuts/de7fddf757ac4db3891783f89e554d94"
        />
        <ShortcutCard
          title="Summarize current chapter"
          icon={MapIcon}
          colors={["to-yellow-300", "from-yellow-500"]}
          url="https://www.icloud.com/shortcuts/d6c11590a9044f27b927c6c7b739960e"
        />
      </div>
    </div>
  )
}

type ShortcutCardProps = {
  title: string
  colors: string[]
  icon: React.ElementType
  url: string
}

function ShortcutCard({ title, icon, colors, url }: ShortcutCardProps) {
  const IconComponent = icon as React.ElementType
  return (
    <a
      className={cn(
        "bg-linear-to-tl rounded-3xl min-h-24 w-36 cursor-pointer transition-all duration-300",
        "hover:scale-125 hover:shadow-2xl",
        "py-2.5 px-4 flex flex-col justify-between",
        ...colors
      )}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex justify-between items-center">
        <div>
          <IconComponent className="size-5 text-white" />
        </div>
        <div className="bg-white/10 rounded-full p-1">
          <PlusIcon className="size-4 text-white" />
        </div>
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
    </a>
  )
}
