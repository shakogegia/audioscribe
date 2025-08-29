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
import { Check, ExternalLink } from "lucide-react";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full">
        <Hero
          title="Audiobookshelf Setup"
          description={["Configure access to your Audiobookshelf server."]}
          icon={
            <Image
              src="https://www.audiobookshelf.org/Logo.png"
              alt="Audiobookshelf"
              width={64}
              height={64}
              className="w-16 h-16"
            />
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
                      className="ml-auto inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                    >
                      Get API Key <ExternalLink className="w-4 h-4" />
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
