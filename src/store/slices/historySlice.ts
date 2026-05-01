import type { StateCreator } from 'zustand'
import type { GameResult } from '@/types'

export interface HistorySlice {
  gameHistory: GameResult[]
  sessionDate: string
  appendResult: (result: GameResult) => void
  clearHistory: () => void
  resetSession: () => void
}

function todayString() {
  return new Date().toLocaleDateString('en-CA')
}

export const createHistorySlice: StateCreator<HistorySlice> = (set) => ({
  gameHistory: [],
  sessionDate: todayString(),

  appendResult: (result) =>
    set((state) => ({ gameHistory: [...state.gameHistory, result] })),

  clearHistory: () => set({ gameHistory: [] }),

  resetSession: () =>
    set({
      gameHistory: [],
      sessionDate: todayString(),
      currentRound: 0,
      activeMatches: [],
      waitingQueue: [],
    }),
})
