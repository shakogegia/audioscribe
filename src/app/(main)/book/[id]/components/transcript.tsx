"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Markdown } from "@/components/markdown"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAiConfig } from "@/hooks/use-ai-config"
import { AudioFile, SearchResult } from "@/types/api"
import axios from "axios"
import { Captions, Loader2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface TranscriptProps {
  bookId: string
  book: SearchResult
  files: AudioFile[]
  play?: (time?: number) => void
}

export function Transcript({ bookId, play, files }: TranscriptProps) {
  const { aiConfig } = useAiConfig()
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptions, setTranscriptions] = useState<{ text: string; index: number }[]>([])

  async function transcribeFullBook() {
    toast.loading("Transcribing full book...", { id: "transcribe-full-book" })
    try {
      setIsTranscribing(true)
      const response = await axios.post(`/api/book/${bookId}/transcribe/full`, {
        config: aiConfig,
      })
      setTranscriptions(response.data.transcriptions)
      toast.success("Transcribed full book", { id: "transcribe-full-book" })
    } catch (error) {
      console.error("Failed to transcribe full book:", error)
      toast.error("Failed to transcribe full book", { id: "transcribe-full-book" })
    } finally {
      setIsTranscribing(false)
    }
  }

  function onTimeClick(file: AudioFile, time: string) {
    const timeToSeconds = time.split(":")
    const hours = parseInt(timeToSeconds[0])
    const minutes = parseInt(timeToSeconds[1])
    const seconds = parseInt(timeToSeconds[2])
    const timeInSeconds = hours * 3600 + minutes * 60 + seconds
    play?.(timeInSeconds + file.start)
  }

  return (
    <div className="flex flex-col gap-4 my-6">
      {transcriptions.length === 0 && (
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          onClick={transcribeFullBook}
          disabled={isTranscribing}
        >
          {isTranscribing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Captions className="w-4 h-4" />}
          Transcribe Full Book
        </Button>
      )}

      {!isTranscribing && transcriptions.length > 0 && (
        <Accordion type="single" collapsible>
          {files.map(file => (
            <AccordionItem key={file.index} value={file.index.toString()}>
              <AccordionTrigger>
                <span>
                  <span className="text-neutral-400 dark:text-neutral-600 pr-2">{file.index}.</span>
                  {file.fileName}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[500px]">
                  <div className="transcript-container [&_.timestamp-button]:pr-1">
                    <Markdown
                      text={parseTranscription(transcriptions.find(t => t.index === file.index)?.text || "")}
                      onTimeClick={time => onTimeClick(file, time)}
                      className=""
                    />
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

function parseTranscription(text: string): string {
  return text.replace(/\[?(\d{2}:\d{2}:\d{2})\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]?/g, "$1").replace(/\n/g, "  \n")
}
