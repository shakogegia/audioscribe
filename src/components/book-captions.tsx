"use client";

import { AudioFile, SearchResult } from "@/types/api";
import { Loader2Icon } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useMount } from "react-use";
import { findTranscriptLine } from "@/lib/caption";
import { useAiConfig } from "@/hooks/use-ai-config";

interface BookCaptionsProps {
  book: SearchResult;
  files: AudioFile[];
  time: number;
}

export interface BookPlayerRef {
  play: (time?: number) => void;
}

export function BookCaptions({ book, files, time }: BookCaptionsProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ text: string; index: number }[]>([]);
  const { aiConfig } = useAiConfig();

  const currentFile = useMemo(() => {
    const file = files.find(file => time >= file.start && time < file.start + file.duration);

    if (!file) {
      const lastFile = files[files.length - 1];
      return { fileIndex: files.length - 1, fileTime: lastFile.duration, fileName: lastFile.fileName };
    }

    const fileIndex = files.findIndex(x => x.ino === file.ino);

    return { fileIndex, fileTime: time - file.start, fileName: file.fileName, index: file.index };
  }, [files, time]);

  const currentFileTranscriptions = useMemo(() => {
    return transcriptions.find(t => t.index === currentFile.index)?.text;
  }, [transcriptions, currentFile.index]);

  const caption = currentFileTranscriptions
    ? findTranscriptLine(currentFileTranscriptions, currentFile.fileTime)
    : null;

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" });
    try {
      setIsTranscribing(true);
      const response = await axios.post(`/api/book/${book.id}/transcribe/full`, {
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

  useMount(() => transcribeFullBook());

  return (
    <div className="flex items-center justify-center gap-1 -mt-4 mb-0.5">
      {isTranscribing && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Loader2Icon className="w-3 h-3 animate-spin" /> Transcribing...
        </div>
      )}
      {!isTranscribing && transcriptions.length > 0 && (
        <div className="text-sm text-muted-foreground min-h-5 flex items-center justify-between w-full font-sans">
          <span className="font-light text-right flex-1 truncate">{caption?.previousLine}</span>
          <span className="font-normal text-center flex-shrink-0 px-1">{caption?.line}</span>
          <span className="font-light text-left flex-1 truncate">{caption?.nextLine}</span>
        </div>
      )}
    </div>
  );
}
