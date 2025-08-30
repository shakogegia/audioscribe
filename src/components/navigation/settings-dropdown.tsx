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
import Link from "next/link";

export function SettingsDropdown() {
  const router = useRouter();
  const { data: { humanReadableSize } = {} } = useSWR("/api/cache/size", { refreshInterval: 10000 });

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
        <Link href="/setup/audiobookshelf">
          <DropdownMenuItem>Audiobookshelf Settings</DropdownMenuItem>
        </Link>

        <Link href="/setup/llm">
          <DropdownMenuItem>LLM Settings</DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <Link href="/setup/asr">
          <DropdownMenuItem>ASR Models</DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={purgeCache}>Purge Cache ({humanReadableSize})</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
