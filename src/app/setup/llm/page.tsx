import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Check, Brain } from "lucide-react";
import GradientIcon from "@/components/gradient-icon";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full">
        <Hero
          title="LLM Setup"
          description={[
            "Configure access to LLM services for enhanced cleanup and processing of chapter titles.",
            "These are optional, but at least one is required to use AI Cleanup.",
          ]}
          icon={
            <GradientIcon icon={<Brain className="w-10 h-10 text-white" />} />
          }
        />

        {/* Card */}
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Audiobookshelf Server</CardTitle>
            <CardDescription>
              Enter your Audiobookshelf URL and API key. The key must act on
              behalf of a user with the following permissions: Can Download, Can
              Update.
            </CardDescription>
            <CardAction>
              <Button variant="link">
                <Check className="w-4 h-4" />
                Configured
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="url">Server URL</Label>
                  <Input
                    id="url"
                    type="text"
                    name="url"
                    placeholder="https://audiobookshelf.example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="apiKey">API Key</Label>
                    <a
                      href="https://www.audiobookshelf.org/guides/api-keys/"
                      target="_blank"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Get API Key
                    </a>
                  </div>
                  <Input
                    id="apiKey"
                    type="text"
                    required
                    placeholder="Enter API Key"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Save
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
