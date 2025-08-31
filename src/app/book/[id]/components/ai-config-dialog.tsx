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
import useAiStore from "../stores/ai";

const whisperModels = [
  {
    name: "tiny",
    disk: "75 MB",
    memory: "~390 MB",
  },
  {
    name: "tiny.en",
    disk: "75 MB",
    memory: "~390 MB",
  },
  {
    name: "base",
    disk: "142 MB",
    memory: "~500 MB",
  },
  {
    name: "base.en",
    disk: "142 MB",
    memory: "~500 MB",
  },
  {
    name: "small",
    disk: "466 MB",
    memory: "~1.0 GB",
  },
  {
    name: "small.en",
    disk: "466 MB",
    memory: "~1.0 GB",
  },
  {
    name: "medium",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
  {
    name: "medium.en",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
  {
    name: "large-v1",
    disk: "2.9 GB",
    memory: "~4.7 GB",
  },
  {
    name: "large",
    disk: "2.9 GB",
    memory: "~4.7 GB",
  },
  {
    name: "large-v3-turbo",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
];

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
    models: [],
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
            <DialogTitle>AI Config</DialogTitle>
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
              <Button type="submit">Save changes</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
