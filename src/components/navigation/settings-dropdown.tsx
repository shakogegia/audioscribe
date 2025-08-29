"use client";

import * as React from "react";
import { Moon, Sun, Cog } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function SettingsDropdown() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Cog className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/setup/audiobookshelf")}>
          Audiobookshelf Setup
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/setup/llm")}>LLM Setup</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
