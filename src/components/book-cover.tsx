"use client"

import { ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"

type Props = {
  src?: string
  alt?: string
  size?: number
  className?: string
}

export default function BookCover({ src, alt, size = 64, className }: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  return (
    <div className={twMerge("relative", className)} style={{ width: size, height: size }}>
      {(isLoading || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-md">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </div>
      )}
      <Image
        ref={imageRef}
        src={src || ""}
        alt={alt || "Audiobook"}
        className={twMerge("object-cover rounded-md", isLoading ? "opacity-0" : "opacity-100", hasError && "opacity-0")}
        width={size}
        height={size}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
