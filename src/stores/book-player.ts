import { create } from "zustand"

interface BookPlayerState {
  currentTime: number
  setCurrentTime: (currentTime: number) => void
}

export const useBookPlayerStore = create<BookPlayerState>(set => ({
  currentTime: 0,
  setCurrentTime: (currentTime: number) => set({ currentTime }),
}))
