"use client"
import { Cog, CommandIcon, House } from "lucide-react"
import Link from "next/link"
import { Button } from "../ui/button"
import { ThemeSwitcher } from "./theme-switcher"

export function Header() {
  function triggerCommandPalette() {
    // trigger cmnd + k
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="flex justify-between items-center p-4">
      <div />
      <div className="flex items-center gap-2 h-5">
        <Link href="/home">
          <Button variant="outline" size="icon">
            <House className="w-4 h-4" />
          </Button>
        </Link>

        <Button variant="outline" size="icon" onClick={triggerCommandPalette}>
          <CommandIcon className="w-4 h-4" />
        </Button>

        <ThemeSwitcher />

        <Link href="/setup/audiobookshelf">
          <Button variant="outline" size="icon">
            <Cog className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
