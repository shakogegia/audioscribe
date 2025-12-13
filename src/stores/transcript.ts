import { create } from "zustand"
import { TranscriptSegment } from "../../generated/prisma"

interface TranscriptState {
  segments: TranscriptSegment[]
  setSegments: (segments: TranscriptSegment[]) => void
}

export const useTranscriptStore = create<TranscriptState>(set => ({
  segments: [],
  setSegments: (segments: TranscriptSegment[]) => set({ segments }),
}))
