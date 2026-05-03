import type { StateCreator } from 'zustand'
import type { CourtConfig, MatchFormat, GenderFormat } from '@/types'

export interface CourtSlice {
  courtConfig: CourtConfig
  setCourtConfig: (patch: Partial<CourtConfig>) => void
  setCourtFormat: (courtIndex: number, format: MatchFormat) => void
  setGenderFormat: (courtIndex: number, format: GenderFormat) => void
}

export const createCourtSlice: StateCreator<CourtSlice> = (set) => ({
  courtConfig: {
    totalCourts: 2,
    format: 'doubles',
    timerDefaultSeconds: 0,
    courtFormats: [],
    rankBalanceEnabled: true,
    genderFormat: 'any',
    courtGenderFormats: [],
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

  setGenderFormat: (courtIndex, format) =>
    set((state) => {
      const courtGenderFormats = [...(state.courtConfig.courtGenderFormats ?? [])]
      courtGenderFormats[courtIndex] = format
      return { courtConfig: { ...state.courtConfig, courtGenderFormats } }
    }),
})
