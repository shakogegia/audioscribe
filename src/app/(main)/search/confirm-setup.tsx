import { WhisperModel } from "@/ai/transcription/types/transription"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import useAiStore from "@/stores/ai"
import { whisperModels } from "@/utils/constants"
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
import { Input } from "@/components/ui/input"
import { AudioLinesIcon } from "lucide-react"

type ConfirmSetupProps = {
  children: React.ReactNode
  onConfirm: (model: WhisperModel) => void
}

export function ConfirmSetup({ children, onConfirm }: ConfirmSetupProps) {
  const { transcriptionModel, setTranscriptionModel } = useAiStore()

  return (
    <Dialog>
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
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={() => onConfirm(transcriptionModel)}>
              <AudioLinesIcon className="w-4 h-4" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
