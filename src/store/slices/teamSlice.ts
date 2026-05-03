import type { StateCreator } from 'zustand'
import type { Team, TeamMatch, TeamColor } from '@/types'
import { generateId } from '@/utils/id'

export interface TeamSlice {
  teams: Team[]
  activeTeamMatch: TeamMatch | null
  addTeam: (name: string, color: TeamColor, playerIds: string[]) => void
  updateTeam: (id: string, patch: Partial<Pick<Team, 'name' | 'color' | 'playerIds'>>) => void
  deleteTeam: (id: string) => void
  startTeamMatch: (match: TeamMatch) => void
  updateTeamCourtScore: (courtIndex: number, scoreA: number | null, scoreB: number | null) => void
  finalizeTeamCourt: (courtIndex: number) => void
  finalizeTeamMatch: () => void
}

export const createTeamSlice: StateCreator<TeamSlice> = (set, get) => ({
  teams: [],
  activeTeamMatch: null,

  addTeam: (name, color, playerIds) =>
    set((state) => ({
      teams: [
        ...state.teams,
        { id: generateId(), name: name.trim(), color, playerIds },
      ],
    })),

  updateTeam: (id, patch) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  deleteTeam: (id) =>
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
      activeTeamMatch:
        state.activeTeamMatch?.teamAId === id || state.activeTeamMatch?.teamBId === id
          ? null
          : state.activeTeamMatch,
    })),

  startTeamMatch: (match) => set({ activeTeamMatch: match }),

  updateTeamCourtScore: (courtIndex, scoreA, scoreB) =>
    set((state) => {
      if (!state.activeTeamMatch) return {}
      return {
        activeTeamMatch: {
          ...state.activeTeamMatch,
          courts: state.activeTeamMatch.courts.map((c) =>
            c.courtIndex === courtIndex ? { ...c, scoreA, scoreB } : c
          ),
        },
      }
    }),

  finalizeTeamCourt: (courtIndex) =>
    set((state) => {
      if (!state.activeTeamMatch) return {}
      return {
        activeTeamMatch: {
          ...state.activeTeamMatch,
          courts: state.activeTeamMatch.courts.map((c) =>
            c.courtIndex === courtIndex ? { ...c, status: 'done' } : c
          ),
        },
      }
    }),

  finalizeTeamMatch: () => {
    const { activeTeamMatch } = get()
    if (!activeTeamMatch) return
    set({
      activeTeamMatch: { ...activeTeamMatch, status: 'completed' },
    })
  },
})
