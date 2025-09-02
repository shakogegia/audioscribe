"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAiStore from "@/stores/ai";
import { whisperModels } from "@/utils/constants";

const aiProviders = [
  {
    name: "OpenAI",
    value: "openai",
  },
  {
    name: "Google",
    value: "google",
    models: [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-8b",
      "gemini-1.5-flash-8b-latest",
      "gemini-1.5-flash-8b-001",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro-001",
      "gemini-1.5-pro-002",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.0-flash-live-001",
      "gemini-2.0-flash-lite",
      "gemini-2.0-pro-exp-02-05",
      "gemini-2.0-flash-thinking-exp-01-21",
      "gemini-2.0-flash-exp",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-image-preview",
      "gemini-2.5-pro-exp-03-25",
      "gemini-2.5-flash-preview-04-17",
      "gemini-exp-1206",
      "gemma-3-12b-it",
      "gemma-3-27b-it",
    ],
  },
  {
    name: "Anthropic",
    value: "anthropic",
    models: [],
  },
  {
    name: "Ollama",
    value: "ollama",
    models: ["llama3.2:3b", "mistral:7b", "llama2:13b", "qwen2.5:7b"],
  },
];

export function AiConfigDialog({ children }: { children: React.ReactNode }) {
  const { transcriptionModel, aiProvider, aiModel, setTranscriptionModel, setAiProvider, setAiModel } = useAiStore();

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Config</DialogTitle>
            <DialogDescription>Adjust AI configuration</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label>Transcription model</Label>
              <Select value={transcriptionModel} onValueChange={setTranscriptionModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a transcription model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Whisper</SelectLabel>
                    {whisperModels.map(model => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>AI Provider</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a transcription model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>AI Providers</SelectLabel>
                    {aiProviders.map(provider => (
                      <SelectItem key={provider.name} value={provider.value}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a transcription model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Model</SelectLabel>
                    {aiProviders
                      .find(provider => provider.value === aiProvider)
                      ?.models?.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="submit" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
