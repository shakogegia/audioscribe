import { WhisperModel } from "@/ai/transcription/types/transription"
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
import { SearchResult } from "@/types/api"
import { whisperModels } from "@/utils/constants"
import axios from "axios"
import { AudioLinesIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type ConfirmSetupProps = {
  children: React.ReactNode
  book: SearchResult
}

export function ConfirmSetup({ children, book }: ConfirmSetupProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Setup book</DialogTitle>
            <DialogDescription>
              This will download the book locally and starts the transcription process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
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
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={() => onConfirm(model)} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AudioLinesIcon className="w-4 h-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
