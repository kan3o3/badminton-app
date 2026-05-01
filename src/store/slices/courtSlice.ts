import type { StateCreator } from 'zustand'
import type { CourtConfig, MatchFormat } from '@/types'

export interface CourtSlice {
  courtConfig: CourtConfig
  setCourtConfig: (patch: Partial<CourtConfig>) => void
  setCourtFormat: (courtIndex: number, format: MatchFormat) => void
}

export const createCourtSlice: StateCreator<CourtSlice> = (set) => ({
  courtConfig: {
    totalCourts: 2,
    format: 'doubles',
    timerDefaultSeconds: 0,
    courtFormats: [],
    rankBalanceEnabled: true,
  },

  setCourtConfig: (patch) =>
    set((state) => ({
      courtConfig: {
        ...state.courtConfig,
        ...patch,
        totalCourts: patch.totalCourts
          ? Math.max(1, Math.min(10, patch.totalCourts))
          : state.courtConfig.totalCourts,
      },
    })),

  setCourtFormat: (courtIndex, format) =>
    set((state) => {
      const courtFormats = [...state.courtConfig.courtFormats]
      courtFormats[courtIndex] = format
      return { courtConfig: { ...state.courtConfig, courtFormats } }
    }),
})
