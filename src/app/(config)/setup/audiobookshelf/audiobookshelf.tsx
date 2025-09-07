"use client"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppConfig } from "@/lib/config"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const formSchema = z.object({
  url: z.string().min(1, { message: "URL is required." }),
  apiKey: z.string().min(1, { message: "API Key is required." }),
})

type Props = {
  config: AppConfig
  updateConfig: (config: AppConfig) => void
}

export default function AudiobookshelfPage({ config, updateConfig }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: config.audiobookshelf.url ?? "",
      apiKey: config.audiobookshelf.apiKey ?? "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    toast.loading("Saving configuration...", { id: "save-config" })
    await updateConfig({
      ...config,
      audiobookshelf: { url: values.url, apiKey: values.apiKey },
    })
    toast.success("Configuration saved", { id: "save-config" })
  }
  return (
    <div className="flex flex-col items-center gap-8 w-full h-full px-4">
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Audiobookshelf Server</CardTitle>
              <CardDescription>
                Enter your Audiobookshelf URL and API key. The key must act on behalf of a user with the following
                permissions: Can Download, Can Update.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Label htmlFor="url">Server URL</Label>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="url"
                            type="text"
                            placeholder="https://audiobookshelf.example.com"
                            required
                            {...field}
                          />
                        </FormControl>
                        {/* <FormDescription>This is your public display name.</FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center w-full">
                            <Label htmlFor="apiKey">API Key</Label>
                            {/* /audiobookshelf/config/api-keys */}
                            <a
                              href={
                                form.getValues("url")
                                  ? `${form.getValues("url")}/audiobookshelf/config/api-keys`
                                  : "https://www.audiobookshelf.org/guides/api-keys/"
                              }
                              target="_blank"
                              className="ml-auto inline-flex items-center gap-1 text-sm font-normal underline-offset-4 hover:underline"
                            >
                              Get API Key <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input id="apiKey" type="password" required placeholder="Enter API Key" {...field} />
                        </FormControl>
                        {/* <FormDescription>This is your public display name.</FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full">
                Save
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
