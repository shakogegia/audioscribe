"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";
import useSWR from "swr";

export default function CachePage() {
	const { data: { humanReadableSize } = {}, mutate } = useSWR("/api/cache/size");

	async function purgeCache() {
    toast.loading("Purging cache...", { id: "purge-cache" });
    await axios.delete("/api/cache/purge");
		await mutate();
    toast.success("Cache purged", { id: "purge-cache" });
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Cache</CardTitle>
        <CardDescription>
          AudioScribe caches various files to improve performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <p>Cache size: {humanReadableSize || "0 MB"}</p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button onClick={purgeCache} className="w-full">
          Purge Cache
        </Button>
      </CardFooter>
    </Card>
  )
}
