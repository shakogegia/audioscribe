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
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";

export function SettingsDropdown() {
  const router = useRouter();

  const { mutate } = useSWR("/api/cache/purge", fetcher, {
    onSuccess: () => {
      toast.success("Cache purged");
    },
  });

  function purgeCache() {
    mutate();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Cog className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/setup/audiobookshelf")}>Audiobookshelf Setup</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/setup/llm")}>LLM Setup</DropdownMenuItem>
        <DropdownMenuItem onClick={purgeCache}>Purge Cache</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
