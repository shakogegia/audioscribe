"use client"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function Logo({ size = 128 }: { size?: number }) {
  const { theme } = useTheme()
  const src = theme === "dark" ? "/logo/logo-light.png" : "/logo/logo-dark.png"
  return (
    <Image
      src={src}
      alt="AudioScribe logo"
      width={size}
      height={size}
      priority
      loading="eager"
      placeholder="blur"
      blurDataURL={src}
      unoptimized
    />
  )
}
