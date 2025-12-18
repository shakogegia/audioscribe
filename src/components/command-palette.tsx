import { CogIcon, HomeIcon, MoonIcon, SearchIcon, StarIcon, SunIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function CommandPalette() {
  const [_, setQuery] = useState<string>("")
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { systemTheme, setTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  function navigateTo(path: string) {
    router.push(path)
    setOpen(false)
  }

  function updateTheme(theme: string) {
    setTheme(theme)
    setOpen(false)
  }

  return (
    <CommandDialog className="rounded-lg border shadow-md md:min-w-[450px]" open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => navigateTo("/home")}>
            <HomeIcon />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/search")}>
            <SearchIcon />
            <span>Search</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/favorites")}>
            <StarIcon />
            <span>Favorites</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => updateTheme("dark")}>
            <MoonIcon />
            <span>Dark theme</span>
          </CommandItem>
          <CommandItem onSelect={() => updateTheme("light")}>
            <SunIcon />
            <span>Light theme</span>
          </CommandItem>
          <CommandItem onSelect={() => updateTheme("system")}>
            {systemTheme === "dark" ? <MoonIcon /> : <SunIcon />}
            <span>System theme</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => navigateTo("/setup/audiobookshelf")}>
            <CogIcon />
            <span>Audiobookshelf Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/llm")}>
            <CogIcon />
            <span>LLM Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/asr")}>
            <CogIcon />
            <span>ASR Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/embedding")}>
            <CogIcon />
            <span>Embedding Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/jobs")}>
            <CogIcon />
            <span>Jobs</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/cache")}>
            <CogIcon />
            <span>Cache</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
