"use client";
import { Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";

export function SettingsDropdown() {
  const router = useRouter();
  const { data: { humanReadableSize } = {} } = useSWR("/api/cache/size");

  async function purgeCache() {
    toast.loading("Purging cache...", { id: "purge-cache" });
    router.push("/");
    await axios.delete("/api/cache/purge");
    toast.success("Cache purged", { id: "purge-cache" });
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
        <DropdownMenuItem onClick={() => router.push("/setup/audiobookshelf")}>
          Audiobookshelf Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/setup/llm")}>LLM Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/setup/asr")}>ASR Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={purgeCache}>Purge Cache ({humanReadableSize})</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
