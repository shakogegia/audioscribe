"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Markdown } from "@/components/markdown";
import { Textarea } from "@/components/ui/textarea";
import { AudioFile, SearchResult } from "@/types/api";
import axios from "axios";
import { Captions, Loader2Icon, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAiConfig } from "@/hooks/use-ai-config";

interface AiChatProps {
  bookId: string;
  book: SearchResult;
  files: AudioFile[];
  play?: (time?: number) => void;
}

export function AiChat({ bookId, play }: AiChatProps) {
  const { aiConfig } = useAiConfig();
  const [isGenerating, setIsGenerating] = useState(false);

  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState("");

  async function sendMessage() {
    try {
      setAnalysis("");
      setIsGenerating(true);
      const response = await axios.post(`/api/book/${bookId}/ai/chat`, {
        message,
        config: aiConfig,
      });
      setAnalysis(response.data.analysis);
      setIsGenerating(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message", { id: "send-message" });
    } finally {
      setIsGenerating(false);
    }
  }

  function onTimeClick(time: string) {
    const timeToSeconds = time.split(".")[0].split(":");
    const hours = parseInt(timeToSeconds[0]);
    const minutes = parseInt(timeToSeconds[1]);
    const seconds = parseInt(timeToSeconds[2]);
    const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
    play?.(timeInSeconds);
  }

  return (
    <div>
      <div className="sm:max-w-2xl flex flex-col gap-4">
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label>Analysis</Label>
            <div>
              {!analysis && !isGenerating && (
                <p className="text-sm">Ask a question to the AI to get a detailed analysis of the book.</p>
              )}

              {isGenerating && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Generating analysis...
                </div>
              )}
              {!isGenerating && analysis && (
                <Markdown className="max-h-[300px] overflow-y-auto" text={analysis} onTimeClick={onTimeClick} />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Message</Label>
          <Textarea
            placeholder="Ask your question here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isGenerating}
            required
            name="message"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="default" onClick={sendMessage} type="submit" disabled={isGenerating || !message}>
            {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
