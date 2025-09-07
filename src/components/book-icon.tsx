import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface BookIconProps {
  icon: ReactNode
}

export default function BookIcon({ icon }: BookIconProps) {
  return (
    <div
      className={twMerge(
        "w-32 h-32 flex items-center justify-center book-icon relative",
        "bg-gradient-to-br from-blue-500 to-pink-500",
        "text-white",
        "[&>svg]:w-12 [&>svg]:h-12 [&>svg]:text-white"
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
    </div>
  )
}
