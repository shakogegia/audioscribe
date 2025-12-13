"use client"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppConfig } from "@/lib/config"
import { ExternalLink, VectorSquare } from "lucide-react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import GradientIcon from "@/components/gradient-icon"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const formSchema = z.object({
  model: z.string().min(1, { message: "Model is required." }),
})

type Props = {
  config: AppConfig
  updateConfig: (config: AppConfig) => void
}

export default function EmbeddingPage({ config, updateConfig }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: config.embeddingModel ?? "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    toast.loading("Saving configuration...", { id: "save-config" })
    await updateConfig({
      ...config,
      embeddingModel: values.model,
    })
    toast.success("Configuration saved", { id: "save-config" })
  }
  return (
    <div className="flex flex-col items-center gap-8 w-full h-full px-4">
      <Hero
        title="Embedding Model Setup"
        description={["Configure the embedding model for your AI-powered features."]}
        icon={<GradientIcon icon={<VectorSquare className="w-10 h-10 text-white" />} />}
      />

      {/* Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Model</CardTitle>
              <CardDescription>Enter the embedding model for your AI-powered features.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center w-full">
                            <Label htmlFor="model">Model</Label>
                            <a
                              href="https://ollama.com/search?c=embedding"
                              target="_blank"
                              className="ml-auto inline-flex items-center gap-1 text-sm font-normal underline-offset-4 hover:underline"
                            >
                              Get Model <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input id="model" type="text" placeholder="all-minilm:latest" required {...field} />
                        </FormControl>
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
