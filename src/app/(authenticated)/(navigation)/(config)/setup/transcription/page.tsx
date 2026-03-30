"use client"

import { Hero } from "@/components/hero"
import GradientIcon from "@/components/gradient-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AudioLines, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import axios from "axios"

const WHISPER_MODELS = [
  { value: "tiny", label: "Tiny", size: "~75 MB" },
  { value: "tiny.en", label: "Tiny (English)", size: "~75 MB" },
  { value: "base", label: "Base", size: "~142 MB" },
  { value: "base.en", label: "Base (English)", size: "~142 MB" },
  { value: "small", label: "Small", size: "~466 MB" },
  { value: "small.en", label: "Small (English)", size: "~466 MB" },
  { value: "medium", label: "Medium", size: "~1.5 GB" },
  { value: "medium.en", label: "Medium (English)", size: "~1.5 GB" },
  { value: "large-v1", label: "Large v1", size: "~2.9 GB" },
  { value: "large-v2", label: "Large v2", size: "~2.9 GB" },
  { value: "large-v3", label: "Large v3", size: "~2.9 GB" },
  { value: "large-v3-turbo", label: "Large v3 Turbo", size: "~1.6 GB" },
  { value: "distil-large-v2", label: "Distil Large v2", size: "~1.5 GB" },
  { value: "distil-large-v3", label: "Distil Large v3", size: "~1.5 GB" },
]

const COMPUTE_TYPES = [
  { value: "auto", label: "auto (recommended)" },
  { value: "int8", label: "int8 (fastest, least memory)" },
  { value: "float16", label: "float16 (balanced)" },
  { value: "float32", label: "float32 (most accurate)" },
]

export default function TranscriptionSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chunkDuration, setChunkDuration] = useState("300")
  const [whisperModel, setWhisperModel] = useState("tiny.en")
  const [computeType, setComputeType] = useState("auto")

  useEffect(() => {
    axios.get("/api/settings").then(({ data }) => {
      setChunkDuration(data["transcription.chunkDuration"] ?? "300")
      setWhisperModel(data["transcription.whisperModel"] ?? "tiny.en")
      setComputeType(data["transcription.computeType"] ?? "int8")
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    try {
      await axios.put("/api/settings", {
        "transcription.chunkDuration": chunkDuration,
        "transcription.whisperModel": whisperModel,
        "transcription.computeType": computeType,
      })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const chunkMinutes = Math.round(parseInt(chunkDuration) / 60)

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm py-20">
        <Loader2Icon className="w-4 h-4 animate-spin" /> Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
      <Hero
        title="Transcription Settings"
        description={["Configure how audiobooks are transcribed with faster-whisper."]}
        icon={<GradientIcon icon={<AudioLines className="w-10 h-10 text-white" />} />}
      />

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>These settings apply to new transcriptions. Changing them won't affect books already transcribed.</CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="chunkDuration">Chunk Duration (seconds)</FieldLabel>
              <Input
                id="chunkDuration"
                type="number"
                min="60"
                max="1800"
                step="60"
                value={chunkDuration}
                onChange={e => setChunkDuration(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Audio is split into {chunkMinutes}-minute chunks for resumable transcription. Smaller chunks = more granular resume points but slightly more overhead.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="whisperModel">Whisper Model</FieldLabel>
              <Select value={whisperModel} onValueChange={setWhisperModel}>
                <SelectTrigger id="whisperModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Models</SelectLabel>
                    {WHISPER_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} ({m.size})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Larger models are more accurate but slower and use more memory. The model is downloaded automatically on first use.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="computeType">Compute Type</FieldLabel>
              <Select value={computeType} onValueChange={setComputeType}>
                <SelectTrigger id="computeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Compute Type</SelectLabel>
                    {COMPUTE_TYPES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Button onClick={save} className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
