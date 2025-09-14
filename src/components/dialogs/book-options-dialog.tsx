import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookBasicInfo } from "@/types/api"
import { WhisperModel } from "@/types/transript"
import { whisperModels } from "@/utils/constants"
import { TranscriptSegment } from "@prisma/client"
import axios from "axios"
import { AudioLinesIcon, FileDownIcon, FileUpIcon, InfoIcon, Loader2, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type BookOptionsProps = {
  title?: string
  children: React.ReactNode
  book: BookBasicInfo
  tabs: BookOptionTab[]
  defaultTab?: BookOptionTab
}

export enum BookOptionTab {
  Setup = "setup",
  Export = "export",
  Import = "import",
  Remove = "remove",
}

const tabTitles: Record<BookOptionTab, string> = {
  [BookOptionTab.Setup]: "Setup",
  [BookOptionTab.Export]: "Export",
  [BookOptionTab.Import]: "Import",
  [BookOptionTab.Remove]: "Remove",
}

export function BookOptionsDialog({ title, children, book, tabs, defaultTab }: BookOptionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<BookOptionTab>(defaultTab || BookOptionTab.Setup)
  const [isLoading, setIsLoading] = useState(false)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)

  const [model, setModel] = useState<WhisperModel>(
    () => whisperModels.find(model => model.name === "tiny.en")?.name ?? whisperModels[0].name
  )

  async function onConfirm(model: WhisperModel) {
    setIsLoading(true)
    toast.loading("Sending a request", { id: "setup-book" })
    await axios.post(`/api/book/${book.id}/setup`, {
      model: model,
    })
    toast.success("Request sent", { id: "setup-book" })
    setIsLoading(false)
    setOpen(false)
    router.push(`/book/${book.id}`)
  }

  async function onExportTranscript() {
    try {
      setIsLoading(true)
      toast.loading("Exporting transcript", { id: "export-transcript" })
      const response = await axios.get<{ segments: TranscriptSegment[]; bookId: string; model: string }>(
        `/api/book/${book.id}/transcript/export`
      )
      const transcript = response.data
      const blob = new Blob([JSON.stringify(transcript)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${book.title} - Transcript (${response.data.model}).audioscribe`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Transcript exported", { id: "export-transcript" })
    } catch (error) {
      console.error("Failed to export transcript", error)
      toast.error("Failed to export transcript", { id: "export-transcript" })
    } finally {
      setIsLoading(false)
    }
  }

  async function onImportTranscript() {
    try {
      setIsLoading(true)
      toast.loading("Importing transcript", { id: "import-transcript" })
      const data = await transcriptFile?.text()
      const jsonData = JSON.parse(data ?? "{}")

      if (jsonData.bookId !== book.id) {
        toast.error("Transcript does not belong to this book", { id: "import-transcript" })
        return
      }

      await axios.post(`/api/book/${book.id}/transcript/import`, { data })
      toast.success("Transcript imported", { id: "import-transcript" })

      router.push(`/book/${book.id}`)
    } catch (error) {
      console.error("Failed to import transcript", error)
      toast.error("Failed to import transcript", { id: "import-transcript" })
    } finally {
      setIsLoading(false)
    }
  }

  async function onRemove() {
    try {
      setIsLoading(true)
      toast.loading("Removing book", { id: "remove-book" })
      await axios.delete(`/api/book/${book.id}/remove`)
      toast.success("Book removed", { id: "remove-book" })
      router.replace("/search")
    } catch (error) {
      console.error("Failed to remove book", error)
      toast.error("Failed to remove book", { id: "remove-book" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title || "Setup book"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as BookOptionTab)}>
            <TabsList className="self-start">
              {tabs.map(tab => (
                <TabsTrigger key={tab} value={tab}>
                  {tabTitles[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={BookOptionTab.Setup}>
              <div className="grid gap-4">
                <Alert>
                  <InfoIcon />
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    <p>Use best (slowest) model you can run on your machine.</p>
                    <ul className="list-inside list-disc text-sm">
                      <li>
                        Fastest model is <span className="font-medium inline">tiny.en</span> but it has the lowest
                        accuracy.
                      </li>
                      <li>
                        Most accurate model is <span className="font-medium inline">large-v3-turbo</span> but it
                        requires more memory and time.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-3">
                  <Label>Transcription model</Label>
                  <Select value={model} onValueChange={value => setModel(value as WhisperModel)}>
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
              </div>
            </TabsContent>

            <TabsContent value={BookOptionTab.Export}>
              <Alert>
                <InfoIcon />
                <AlertTitle>Export Transcript</AlertTitle>
                <AlertDescription>
                  <p>Export the transcript of the book in JSON format with timestamps.</p>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value={BookOptionTab.Import}>
              <Alert>
                <InfoIcon />
                <AlertTitle>Import Transcript</AlertTitle>
                <AlertDescription>
                  <p>Import the transcript of the book in JSON format with timestamps.</p>
                </AlertDescription>
              </Alert>

              <div className="grid w-full items-center gap-3 mt-4">
                <Label htmlFor="picture">Transcript</Label>
                <Input
                  id="picture"
                  type="file"
                  accept=".audioscribe"
                  onChange={e => setTranscriptFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </TabsContent>

            <TabsContent value={BookOptionTab.Remove}>
              <Alert variant="destructive">
                <InfoIcon />
                <AlertTitle>Remove Book</AlertTitle>
                <AlertDescription>
                  <p>Remove the book from the database.</p>
                  <p>All data will be deleted including transcript, vectorized data, and book.</p>
                  <p>This action cannot be undone.</p>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            {activeTab === BookOptionTab.Setup && (
              <Button type="submit" onClick={() => onConfirm(model)} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AudioLinesIcon className="w-4 h-4" />}
                Start Setup
              </Button>
            )}

            {activeTab === BookOptionTab.Export && (
              <Button type="submit" onClick={() => onExportTranscript()} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDownIcon className="w-4 h-4" />}
                Export
              </Button>
            )}

            {activeTab === BookOptionTab.Import && (
              <Button type="submit" onClick={() => onImportTranscript()} disabled={isLoading || !transcriptFile}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUpIcon className="w-4 h-4" />}
                Import
              </Button>
            )}

            {activeTab === BookOptionTab.Remove && (
              <ConfirmDialog
                title="Remove Book"
                description="All data will be deleted including transcript, vectorized data, and book. This action cannot be undone."
                onConfirm={onRemove}
              >
                <Button type="submit" disabled={isLoading} variant="destructive">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
                  Remove
                </Button>
              </ConfirmDialog>
            )}
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
