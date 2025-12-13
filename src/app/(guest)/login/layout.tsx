import Logo from "@/components/logo"

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-4 w-full">
        <Logo size={128} />
        <div className="w-full max-w-sm mx-auto">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
