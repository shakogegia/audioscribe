import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface HeroProps {
  title: string;
  description?: string[];
  icon: ReactNode;
}

export function Hero({ title, description, icon }: HeroProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {icon}
      <div className="flex flex-col items-center">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{title}</h3>

        {description?.map((text, index) => (
          <p key={index} className={twMerge("leading-7", index === 0 && "[&:not(:first-child)]:mt-6")}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
