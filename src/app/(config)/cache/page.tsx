"use client";
import GradientIcon from "@/components/gradient-icon";
import { Hero } from "@/components/hero";
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
import { DatabaseZap } from "lucide-react";
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
		<div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
			<Hero
        title="Cache"
        description={[
					"AudioScribe caches various files to improve performance.",
					"These include audiofiles, transcriptions, etc.",
				]}
        icon={<GradientIcon icon={<DatabaseZap className="w-10 h-10 text-white" />} />}
      />
			
			<Card className="w-full max-w-lg mx-auto">
				<CardHeader>
					<CardTitle>Cache</CardTitle>
					<CardDescription>
						Cache size: {humanReadableSize || "0 MB"}
					</CardDescription>
				</CardHeader>
				<CardFooter className="flex-col gap-2">
					<Button onClick={purgeCache} className="w-full">
						Purge Cache
					</Button>
				</CardFooter>
			</Card>
		</div>
  )
}
