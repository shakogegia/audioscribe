"use client"

import GradientIcon from "@/components/gradient-icon"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AppConfig } from "@/lib/config"
import { Brain, ExternalLink } from "lucide-react"
import { useMount } from "react-use"
import { toast } from "sonner"
import useLLMStore from "./store"

type Props = {
  config: AppConfig | null
  updateConfig: (config: AppConfig) => void
}

export default function LLMSetup({ config, updateConfig }: Props) {
  const { config: llmConfig, update } = useLLMStore()

  useMount(() => {
    if (config) {
      update(config)
    }
  })

  async function save() {
    toast.loading("Saving configuration...", { id: "save-config" })
    update(llmConfig)
    await updateConfig({
      ...(config || llmConfig),
      aiProviders: llmConfig.aiProviders,
    })
    toast.success("Configuration saved", { id: "save-config" })
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4 mb-10">
      <Hero
        title="AI Provider Setup"
        description={[
          "Configure AI providers for bookmark title suggestions and transcription.",
          "At least one provider is required for AI-powered features.",
        ]}
        icon={<GradientIcon icon={<Brain className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-2xl space-y-6">
        <AiCard
          title="Gemini"
          description="Requires a Google AI API key (free or paid tier)."
          enabled={llmConfig.aiProviders.google.enabled}
          onCheckedChange={enabled =>
            update({
              ...llmConfig,
              aiProviders: { ...llmConfig.aiProviders, google: { ...llmConfig.aiProviders.google, enabled } },
            })
          }
          fields={[
            {
              label: "API Key",
              hidden: true,
              placeholder: "Enter API Key",
              value: llmConfig.aiProviders.google.apiKey || "",
              onChange: apiKey => {
                update({
                  ...llmConfig,
                  aiProviders: {
                    ...llmConfig.aiProviders,
                    google: { ...llmConfig.aiProviders.google, apiKey },
                  },
                })
              },
              help: { href: "https://aistudio.google.com/apikey", text: "Get API Key" },
            },
          ]}
        />

        <AiCard
          title="OpenAI"
          description="Requires an OpenAI account with prepaid API credits."
          enabled={llmConfig.aiProviders.openai.enabled}
          onCheckedChange={enabled =>
            update({
              ...llmConfig,
              aiProviders: { ...llmConfig.aiProviders, openai: { ...llmConfig.aiProviders.openai, enabled } },
            })
          }
          fields={[
            {
              label: "API Key",
              hidden: true,
              placeholder: "Enter API Key",
              value: llmConfig.aiProviders.openai.apiKey || "",
              onChange: apiKey => {
                update({
                  ...llmConfig,
                  aiProviders: {
                    ...llmConfig.aiProviders,
                    openai: { ...llmConfig.aiProviders.openai, apiKey },
                  },
                })
              },
              help: { href: "https://platform.openai.com/api-keys", text: "Get API Key" },
            },
          ]}
        />

        <AiCard
          title="Ollama"
          description="Free and private access to local LLMs when you self-host Ollama. Be aware that small models may not produce usable results."
          enabled={llmConfig.aiProviders.ollama.enabled}
          onCheckedChange={enabled =>
            update({
              ...llmConfig,
              aiProviders: { ...llmConfig.aiProviders, ollama: { ...llmConfig.aiProviders.ollama, enabled } },
            })
          }
          fields={[
            {
              label: "Base URL",
              placeholder: "http://localhost:11434",
              value: llmConfig.aiProviders.ollama.baseUrl || "",
              onChange: baseUrl => {
                update({
                  ...llmConfig,
                  aiProviders: {
                    ...llmConfig.aiProviders,
                    ollama: { ...llmConfig.aiProviders.ollama, baseUrl },
                  },
                })
              },
            },
          ]}
        />

        <Button className="w-full" onClick={save}>
          Save Configuration
        </Button>
      </div>
    </div>
  )
}

type AiCardProps = {
  title: string
  description: string
  enabled: boolean
  onCheckedChange: (enabled: boolean) => void
  fields: {
    label: string
    value: string
    hidden?: boolean
    onChange: (value: string) => void
    help?: { href: string; text: string }
    placeholder?: string
  }[]
}
function AiCard({ title, description, enabled, onCheckedChange, fields }: AiCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Switch checked={enabled} onCheckedChange={onCheckedChange} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {fields.map(field => (
          <div className="grid gap-2" key={field.label}>
            <div className="flex items-center">
              <Label htmlFor="openai-api-key">{field.label}</Label>
              {field.help && (
                <a
                  href={field.help.href}
                  target="_blank"
                  className="ml-auto inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                >
                  {field.help.text} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <Input
              id="openai-api-key"
              type={field.hidden ? "password" : "text"}
              placeholder={field.placeholder}
              defaultValue={field.value || ""}
              onChange={e => field.onChange(e.target.value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
