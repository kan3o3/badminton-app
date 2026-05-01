import { useMemo } from 'react'
import useAppStore from '@/store/useAppStore'
import { computePlayerStats } from '@/utils/scoring'

export function useStats(dateFilter: 'today' | 'all' = 'all') {
  const players = useAppStore((s) => s.players)
  const gameHistory = useAppStore((s) => s.gameHistory)
  const sessionDate = useAppStore((s) => s.sessionDate)

  return useMemo(() => {
    const filtered = dateFilter === 'today'
      ? gameHistory.filter((r) => r.sessionDate === sessionDate)
      : gameHistory
    return computePlayerStats(filtered, players)
  }, [players, gameHistory, sessionDate, dateFilter])
}
