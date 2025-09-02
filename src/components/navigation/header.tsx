import { Cog, House, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { AiConfigDialog } from "@/components/dialogs/ai-config-dialog";
import { Separator } from "@/components/ui/separator"

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <div />
      <div className="flex items-center gap-2 h-5">
        <AiConfigDialog>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </AiConfigDialog>

        <Separator orientation="vertical" />

        <Link href="/">
          <Button variant="outline" size="icon">
            <House className="w-4 h-4" />
          </Button>
        </Link>

        <ThemeSwitcher />
        <Link href="/setup/audiobookshelf">
          <Button variant="outline" size="icon">
            <Cog className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
