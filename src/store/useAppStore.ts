import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice'
import { createCourtSlice, type CourtSlice } from './slices/courtSlice'
import { createHistorySlice, type HistorySlice } from './slices/historySlice'
import { createMatchSlice, type MatchSlice } from './slices/matchSlice'
import { createPairSlice, type PairSlice } from './slices/pairSlice'
import { createTeamSlice, type TeamSlice } from './slices/teamSlice'

type AppStore = PlayerSlice & CourtSlice & HistorySlice & MatchSlice & PairSlice & TeamSlice

const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createCourtSlice(...a),
      ...createHistorySlice(...a),
      ...createMatchSlice(...a),
      ...createPairSlice(...a),
      ...createTeamSlice(...a),
    }),
    {
      name: 'badminton-app-v1',
      version: 5,
    }
  )
)

export default useAppStore
