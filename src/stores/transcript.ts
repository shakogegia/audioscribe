import { TranscriptSegment } from "@prisma/client"
import { create } from "zustand"

interface TranscriptState {
  segments: TranscriptSegment[]
  setSegments: (segments: TranscriptSegment[]) => void
}

export const useTranscriptStore = create<TranscriptState>(set => ({
  segments: [],
  setSegments: (segments: TranscriptSegment[]) => set({ segments }),
}))
