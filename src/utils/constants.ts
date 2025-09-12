import { WhisperModel } from "@/types/transript"

export const whisperModels: { name: WhisperModel; disk: string; memory: string }[] = [
  { name: "tiny", disk: "75 MB", memory: "~390 MB" },
  { name: "tiny.en", disk: "75 MB", memory: "~390 MB" },
  { name: "base", disk: "142 MB", memory: "~500 MB" },
  { name: "base.en", disk: "142 MB", memory: "~500 MB" },
  { name: "small", disk: "466 MB", memory: "~1.0 GB" },
  { name: "small.en", disk: "466 MB", memory: "~1.0 GB" },
  { name: "medium", disk: "1.5 GB", memory: "~2.6 GB" },
  { name: "medium.en", disk: "1.5 GB", memory: "~2.6 GB" },
  { name: "large-v1", disk: "2.9 GB", memory: "~4.7 GB" },
  { name: "large", disk: "2.9 GB", memory: "~4.7 GB" },
  { name: "large-v3-turbo", disk: "1.5 GB", memory: "~2.6 GB" },
]
