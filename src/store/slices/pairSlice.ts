import type { StateCreator } from 'zustand'
import type { FixedPair } from '@/types'
import { generateId } from '@/utils/id'

export interface PairSlice {
  pairs: FixedPair[]
  addPair: (playerIds: [string, string]) => void
  deletePair: (id: string) => void
}

export const createPairSlice: StateCreator<PairSlice> = (set) => ({
  pairs: [],

  addPair: (playerIds) =>
    set((state) => ({
      pairs: [...state.pairs, { id: generateId(), playerIds }],
    })),

  deletePair: (id) =>
    set((state) => ({
      pairs: state.pairs.filter((p) => p.id !== id),
    })),
})
