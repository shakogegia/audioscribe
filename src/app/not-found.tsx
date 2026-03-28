import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestionIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <FileQuestionIcon className="size-12 text-muted-foreground" />
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-lg text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/home">Go Home</Link>
      </Button>
    </div>
  )
}
