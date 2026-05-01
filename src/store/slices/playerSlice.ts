import type { StateCreator } from 'zustand'
import type { Player, PlayerStatus, SkillRank } from '@/types'
import { generateId } from '@/utils/id'

export interface PlayerSlice {
  players: Player[]
  addPlayer: (name: string, rank: SkillRank) => void
  updatePlayer: (id: string, patch: Partial<Pick<Player, 'name' | 'rank'>>) => void
  deletePlayer: (id: string) => void
  setPlayerStatus: (id: string, status: PlayerStatus) => void
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  players: [],

  addPlayer: (name, rank) =>
    set((state) => ({
      players: [
        ...state.players,
        {
          id: generateId(),
          name: name.trim(),
          status: 'active',
          rank,
          createdAt: Date.now(),
        },
      ],
    })),

  updatePlayer: (id, patch) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  deletePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),

  setPlayerStatus: (id, status) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
})
