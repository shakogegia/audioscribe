import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface HeroProps {
  title: string
  description?: string[]
  icon: ReactNode
  content?: ReactNode
}

export function Hero({ title, description, icon, content }: HeroProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {icon}
      <div className="flex flex-col items-center gap-1">
        <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight text-center font-sans">{title}</h3>

        {description && (
          <div className="flex flex-col text-muted-foreground text-center">
            {description?.map((text, index) => (
              <p key={index} className={twMerge("leading-7")}>
                {text}
              </p>
            ))}
          </div>
        )}

        {content}
      </div>
    </div>
  )
}
