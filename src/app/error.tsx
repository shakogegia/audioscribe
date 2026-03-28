"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <AlertCircleIcon className="size-12 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
