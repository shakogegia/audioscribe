"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { useAiConfig } from "../hooks/use-ai-config";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";
import { Captions, Loader2Icon, Send } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { SearchResult } from "@/types/api";
import { AudioFile } from "@/types/api";
import { BookPlayer } from "@/components/book-player";
import { DialogClose } from "@radix-ui/react-dialog";

interface AiChatDialogProps {
  bookId: string;
  book: SearchResult;
  files: AudioFile[];
  children: React.ReactNode;
}

export function AiChatDialog({ bookId, book, files, children }: AiChatDialogProps) {
  const { aiConfig } = useAiConfig();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ text: string }[]>([]);

  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState("");

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" });
    try {
      setIsTranscribing(true);
      const response = await axios.post(`/api/book/${bookId}/transcribe/full`, {
        config: aiConfig,
      });
      setTranscriptions(response.data.transcriptions);
      toast.success("Transcribed full book", { id: "transcribe-full-book" });
    } catch (error) {
      console.error("Failed to transcribe full book:", error);
      toast.error("Failed to transcribe full book", { id: "transcribe-full-book" });
    } finally {
      setIsTranscribing(false);
    }
  }

  async function sendMessage() {
    try {
      setAnalysis("");
      setIsGenerating(true);
      const response = await axios.post(`/api/book/${bookId}/ai/query`, {
        transcriptions,
        message,
        config: aiConfig,
      });
      console.log("🚀 ~ sendMessage ~ response:", response);
      setAnalysis(response.data.analysis);
      setIsGenerating(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message", { id: "send-message" });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>AI Chat</DialogTitle>
            <DialogDescription>Chat with the AI about the book</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <BookPlayer book={book} files={files} controls="compact" />
            </div>

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
                {!isGenerating && analysis && <Markdown className="max-h-[300px] overflow-y-auto" text={analysis} />}
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

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="button" onClick={transcribeFullBook} disabled={isTranscribing}>
              {isTranscribing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Captions className="w-4 h-4" />}
              Transcribe Full Book
            </Button>

            <Button
              onClick={sendMessage}
              type="submit"
              disabled={isTranscribing || isGenerating || !message || !transcriptions.length}
            >
              {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
