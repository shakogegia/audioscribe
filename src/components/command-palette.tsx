import {
  AudioLinesIcon,
  BadgeInfo,
  ChartNoAxesCombinedIcon,
  BellIcon,
  BookOpenCheckIcon,
  BrainCircuitIcon,
  BrainIcon,
  CircleDashedIcon,
  DatabaseZapIcon,
  HomeIcon,
  Layers2Icon,
  LibraryBigIcon,
  MicIcon,
  MoonIcon,
  NavigationIcon,
  StarIcon,
  SunIcon,
  WebhookIcon,
} from "lucide-react"

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
          <CommandItem onSelect={() => navigateTo("/favorites")}>
            <StarIcon />
            <span>Favorites</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/processed")}>
            <BookOpenCheckIcon />
            <span>Ready</span>
          </CommandItem>
          {/* processing */}
          <CommandItem onSelect={() => navigateTo("/processing")}>
            <CircleDashedIcon />
            <span>Processing</span>
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
        <CommandGroup heading="Prompts">
          <CommandItem onSelect={() => navigateTo("/prompts")}>
            <BrainIcon />
            <span>Prompts</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/prompts/suggestions")}>
            <NavigationIcon />
            <span>Suggestions</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="iOS">
          <CommandItem onSelect={() => navigateTo("/ios/shortcuts")}>
            <Layers2Icon />
            <span>Shortcuts</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/ios/endpoints")}>
            <WebhookIcon />
            <span>Endpoints</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Analytics">
          <CommandItem onSelect={() => navigateTo("/stats")}>
            <ChartNoAxesCombinedIcon />
            <span>Stats</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Configuration">
          <CommandItem onSelect={() => navigateTo("/setup/audiobookshelf")}>
            <LibraryBigIcon />
            <span>Audiobookshelf</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/llm")}>
            <BrainCircuitIcon />
            <span>AI Providers</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/transcription")}>
            <AudioLinesIcon />
            <span>Transcription</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/tts")}>
            <MicIcon />
            <span>Text-to-Speech</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/setup/pushover")}>
            <BellIcon />
            <span>Pushover</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/cache")}>
            <DatabaseZapIcon />
            <span>Cache</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Other">
          <CommandItem onSelect={() => navigateTo("/about")}>
            <BadgeInfo />
            <span>About</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
