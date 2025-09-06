import { create } from "zustand"

interface PlayerState {
  currentTime: number
  setCurrentTime: (currentTime: number) => void
}

export const usePlayerStore = create<PlayerState>(set => ({
  currentTime: 0,
  setCurrentTime: (currentTime: number) => set({ currentTime }),
}))
