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
import { useAiConfig } from "../hooks/use-ai-config";

interface TranscriptProps {
  bookId: string;
  book: SearchResult;
  files: AudioFile[];
  play?: (time?: number) => void;
}

export function Transcript({ bookId, play }: TranscriptProps) {
  const { aiConfig } = useAiConfig();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ text: string }[]>([]);

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

  function onTimeClick(time: string) {
    const timeToSeconds = time.split(":");
    const hours = parseInt(timeToSeconds[0]);
    const minutes = parseInt(timeToSeconds[1]);
    const seconds = parseInt(timeToSeconds[2]);
    const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
    play?.(timeInSeconds);
  }

  return (
    <div className="flex flex-col gap-4 my-10">
      <Button className="w-full" type="button" onClick={transcribeFullBook} disabled={isTranscribing}>
        {isTranscribing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Captions className="w-4 h-4" />}
        Transcribe Full Book
      </Button>

      {transcriptions.length > 0 && (
        <div>
          <Markdown
            text={transcriptions
              .map(transcription =>
                transcription.text
                  .replace(/\[?(\d{2}:\d{2}:\d{2})\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]?/g, "$1")
                  .replace(/\n/g, "  \n")
              )
              .join("\n\n")}
            onTimeClick={onTimeClick}
          />
        </div>
      )}
    </div>
  );
}
