"use client";

import GradientIcon from "@/components/gradient-icon";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppConfig } from "@/lib/config";
import { Brain, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import useLLMStore from "./store";
import { useMount } from "react-use";

type Props = {
  config: AppConfig | null;
  updateConfig: (config: AppConfig) => void;
};

export default function LLMSetup({ config, updateConfig }: Props) {
  const { config: llmConfig, update } = useLLMStore();

  useMount(() => {
    if (config) {
      update(config);
    }
  });

  async function save() {
    toast.loading("Saving configuration...", { id: "save-config" });
    update(llmConfig);
    await updateConfig({
      ...(config || llmConfig),
      aiProviders: llmConfig.aiProviders,
    });
    toast.success("Configuration saved", { id: "save-config" });
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
      <Hero
        title="AI Provider Setup"
        description={[
          "Configure AI providers for bookmark title suggestions and transcription.",
          "At least one provider is required for AI-powered features.",
        ]}
        icon={<GradientIcon icon={<Brain className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-2xl space-y-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>OpenAI</CardTitle>
                <CardDescription>Requires an OpenAI account with prepaid API credits.</CardDescription>
              </div>
            </div>
            <CardAction>
              <Switch
                checked={llmConfig.aiProviders.openai.enabled}
                onCheckedChange={enabled =>
                  update({
                    ...llmConfig,
                    aiProviders: {
                      ...llmConfig.aiProviders,
                      openai: { ...llmConfig.aiProviders.openai, enabled },
                    },
                  })
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="openai-api-key">API Key</Label>
                <a
                  href={"https://platform.openai.com/api-keys"}
                  target="_blank"
                  className="ml-auto inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                >
                  Get API Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <Input
                id="openai-api-key"
                type="password"
                placeholder="Enter API Key"
                value={llmConfig.aiProviders.openai.apiKey || ""}
                onChange={e =>
                  updateConfig({
                    ...llmConfig,
                    aiProviders: {
                      ...llmConfig.aiProviders,
                      openai: { ...llmConfig.aiProviders.openai, apiKey: e.target.value },
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={save}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
