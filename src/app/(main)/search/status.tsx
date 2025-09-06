"use client"
import { twMerge } from "tailwind-merge"

export default function SearchStatus({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge("flex items-center justify-center p-8 text-sm text-neutral-600", className)}>
      {children}
    </div>
  )
}
