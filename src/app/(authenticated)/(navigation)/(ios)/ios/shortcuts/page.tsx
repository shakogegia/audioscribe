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

      <div className="grid grid-cols-4 gap-8">
        <ShortcutCard title="Previously on" icon={CirclePlayIcon} colors={["to-blue-400", "from-blue-700"]} />
        <ShortcutCard
          title="What just happened?"
          icon={CircleQuestionMarkIcon}
          colors={["to-purple-400", "from-purple-700"]}
        />
        <ShortcutCard
          title="Summarize previous chapter"
          icon={BookmarkIcon}
          colors={["to-green-400", "from-green-700"]}
        />
        <ShortcutCard title="Summarize current chapter" icon={MapIcon} colors={["to-yellow-300", "from-yellow-500"]} />
      </div>
    </div>
  )
}

type ShortcutCardProps = {
  title: string
  colors: string[]
  icon: React.ElementType
}

function ShortcutCard({ title, icon, colors }: ShortcutCardProps) {
  const IconComponent = icon as React.ElementType
  return (
    <div
      className={cn(
        "bg-linear-to-tl rounded-3xl min-h-24 w-36 cursor-pointer transition-all duration-300",
        "hover:scale-125 hover:shadow-2xl",
        "py-2.5 px-4 flex flex-col justify-between",
        ...colors
      )}
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
    </div>
  )
}
