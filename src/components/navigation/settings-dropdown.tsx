"use client";

import { Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SettingsDropdown() {
  const router = useRouter();

  async function purgeCache() {
    await axios.delete("/api/cache/purge");
    toast.success("Cache purged");
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
