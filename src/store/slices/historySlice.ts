import type { StateCreator } from 'zustand'
import type { GameResult } from '@/types'

export interface HistorySlice {
  gameHistory: GameResult[]
  sessionDate: string
  appendResult: (result: GameResult) => void
  updateGameResult: (id: string, scoreA: number | null, scoreB: number | null) => void
  swapHistoryPlayers: (roundNumber: number, idA: string, idB: string) => void
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

  swapHistoryPlayers: (roundNumber, idA, idB) =>
    set((state) => {
      type Loc = { resultId: string; side: 'sideA' | 'sideB'; index: number }
      const find = (id: string): Loc | null => {
        for (const r of state.gameHistory) {
          if (r.roundNumber !== roundNumber) continue
          const ai = r.sideA.indexOf(id)
          if (ai !== -1) return { resultId: r.id, side: 'sideA', index: ai }
          const bi = r.sideB.indexOf(id)
          if (bi !== -1) return { resultId: r.id, side: 'sideB', index: bi }
        }
        return null
      }
      const locA = find(idA)
      const locB = find(idB)
      if (!locA || !locB) return state
      return {
        gameHistory: state.gameHistory.map((r) => {
          if (r.roundNumber !== roundNumber) return r
          if (r.id !== locA.resultId && r.id !== locB.resultId) return r
          const sideA = [...r.sideA]
          const sideB = [...r.sideB]
          const apply = (loc: Loc, val: string) => {
            if (loc.side === 'sideA') sideA[loc.index] = val
            else sideB[loc.index] = val
          }
          if (r.id === locA.resultId) apply(locA, idB)
          if (r.id === locB.resultId) apply(locB, idA)
          return { ...r, sideA, sideB }
        }),
      }
    }),

  clearHistory: () => set({ gameHistory: [] }),

  resetSession: () =>
    set({
      gameHistory: [],
      sessionDate: todayString(),
    }),
})
