import Logo from "@/components/logo"
import { AudioLines } from "lucide-react"

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:flex lg:flex-col lg:justify-between p-10">
        <div className="flex items-center gap-2 font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </div>
          AudioScribe
        </div>
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
          </p>
          <footer className="text-sm text-muted-foreground">George R.R. Martin</footer>
        </blockquote>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col items-center gap-6 lg:hidden mb-8">
              <Logo size={64} />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
