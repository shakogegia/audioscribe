"use client"
import { BadgeInfo, BrainIcon, Cog, CommandIcon, House, Layers2Icon, List, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "../ui/button"
import { ThemeSwitcher } from "./theme-switcher"
import { logout } from "@/actions/auth"

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

        <Link href="/about">
          <Button variant="outline" size="icon">
            <BadgeInfo className="w-4 h-4" />
          </Button>
        </Link>

        {/* Prompts */}
        <Link href="/prompts">
          <Button variant="outline" size="icon">
            <BrainIcon className="w-4 h-4" />
          </Button>
        </Link>

        {/* iOS */}
        <Link href="/ios/shortcuts">
          <Button variant="outline" size="icon">
            <Layers2Icon className="w-4 h-4" />
          </Button>
        </Link>

        {/* Jobs */}
        <Link href="/jobs" target="audioscribe-jobs">
          <Button variant="outline" size="icon">
            <List className="w-4 h-4" />
          </Button>
        </Link>

        <form action={logout}>
          <Button variant="outline" size="icon" type="submit">
            <LogOut className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}
