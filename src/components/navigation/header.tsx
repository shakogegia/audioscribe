import { House } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { SettingsDropdown } from "./settings-dropdown";
import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <div />
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="outline" size="icon">
            <House className="w-4 h-4" />
          </Button>
        </Link>
        <ThemeSwitcher />
        <SettingsDropdown />
      </div>
    </header>
  );
}
