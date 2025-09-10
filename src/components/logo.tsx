"use client"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function Logo({ size = 128 }: { size?: number }) {
  const { resolvedTheme } = useTheme()
  const src = resolvedTheme === "dark" ? "/logo/logo-mono-dark.png" : "/logo/logo-dark.png"
  return (
    <Image
      suppressHydrationWarning
      src={src}
      alt="AudioScribe logo"
      width={size}
      height={size}
      priority
      loading="eager"
      unoptimized
    />
  )
}
