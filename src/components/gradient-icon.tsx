import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface GradientIconProps {
  icon: ReactNode
  size?: number
  gradient?: string
}

export default function GradientIcon({ icon, size = 16, gradient = "from-blue-500 to-pink-500" }: GradientIconProps) {
  return (
    <div
      className={twMerge(`rounded-full flex items-center justify-center bg-black text-white`, `w-${size} h-${size}`)}
    >
      {icon}
    </div>
  )
}
