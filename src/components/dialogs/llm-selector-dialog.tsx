"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useLLMStore from "@/stores/llm"

const llmProviders = [
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
    name: "Ollama",
    value: "ollama",
    models: ["llama3.2:3b", "mistral:7b", "llama2:13b", "qwen2.5:7b"],
  },
]

export function LLMSelectorDialog({ children }: { children: React.ReactNode }) {
  const { provider, model, setProvider, setModel } = useLLMStore()

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>LLM Configuration</DialogTitle>
            <DialogDescription>
              Select the LLM provider and model to use for the bookmark suggestions, chat, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a LLM provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>LLM Providers</SelectLabel>
                    {llmProviders.map(provider => (
                      <SelectItem key={provider.name} value={provider.value}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a LLM model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Model</SelectLabel>
                    {llmProviders
                      .find(_provider => _provider.value === provider)
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
              <Button type="submit" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
