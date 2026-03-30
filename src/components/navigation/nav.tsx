import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AudioLinesIcon,
  BellIcon,
  BrainCircuitIcon,
  BrainIcon,
  CogIcon,
  DatabaseZapIcon,
  Layers2Icon,
  LibraryBigIcon,
  LogOutIcon,
  MicIcon,
  NavigationIcon,
  WebhookIcon,
} from "lucide-react"
import Link from "next/link"
import { Fragment } from "react/jsx-runtime"

const menuItems = [
  {
    label: "Prompts",
    children: [
      {
        label: "Prompts",
        href: "/prompts",
        icon: BrainIcon,
      },
      {
        label: "Suggestions",
        href: "/prompts/suggestions",
        icon: NavigationIcon,
      },
    ],
  },
  {
    label: "iOS",
    children: [
      {
        label: "Shortcuts",
        href: "/ios/shortcuts",
        icon: Layers2Icon,
      },
      {
        label: "Endpoints",
        href: "/ios/endpoints",
        icon: WebhookIcon,
      },
    ],
  },
  {
    label: "Configuration",
    children: [
      {
        label: "Audiobookshelf",
        href: "/setup/audiobookshelf",
        icon: LibraryBigIcon,
      },
      {
        label: "AI Providers",
        href: "/setup/llm",
        icon: BrainCircuitIcon,
      },
      {
        label: "Transcription",
        href: "/setup/transcription",
        icon: AudioLinesIcon,
      },
      {
        label: "Text-to-Speech",
        href: "/setup/tts",
        icon: MicIcon,
      },
      {
        label: "Pushover",
        href: "/setup/pushover",
        icon: BellIcon,
      },
      {
        label: "Cache",
        href: "/cache",
        icon: DatabaseZapIcon,
      },
    ],
  },
  {
    label: "User",
    children: [
      {
        label: "Log out",
        href: "/logout",
        icon: LogOutIcon,
      },
    ],
  },
]

export function NavigationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <CogIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {menuItems.map((item, itemIndex) => (
          <Fragment key={item.label}>
            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
            <DropdownMenuGroup>
              {item.children.map(child => (
                <DropdownMenuItem key={child.label} asChild>
                  <Link href={child.href}>
                    <child.icon className="w-4 h-4" />
                    {child.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {itemIndex < menuItems.length - 1 && <DropdownMenuSeparator />}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
