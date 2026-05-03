import type { StateCreator } from 'zustand'
import type { GameResult } from '@/types'

export interface HistorySlice {
  gameHistory: GameResult[]
  sessionDate: string
  appendResult: (result: GameResult) => void
  updateGameResult: (id: string, scoreA: number | null, scoreB: number | null) => void
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

  updateGameResult: (id, scoreA, scoreB) =>
    set((state) => ({
      gameHistory: state.gameHistory.map((r) => {
        if (r.id !== id) return r
        let winningSide: GameResult['winningSide'] = 'draw'
        if (scoreA !== null && scoreB !== null) {
          if (scoreA > scoreB) winningSide = 'A'
          else if (scoreB > scoreA) winningSide = 'B'
        }
        return { ...r, scoreA, scoreB, winningSide }
      }),
    })),

  clearHistory: () => set({ gameHistory: [] }),

  resetSession: () =>
    set({
      gameHistory: [],
      sessionDate: todayString(),
    }),
})
