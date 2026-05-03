import type { Player, Team, TeamCourtAssignment, MatchFormat } from '@/types'
import { generateId } from '@/utils/id'

const RANK_VALUES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }

function rankValue(p: Player): number {
  return p.rank ? RANK_VALUES[p.rank] : 2.5
}

export function generateTeamCourtAssignments(
  teamA: Team,
  teamB: Team,
  allPlayers: Player[],
  totalCourts: number,
  format: MatchFormat
): TeamCourtAssignment[] {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]))
  const playersA = teamA.playerIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[]
  const playersB = teamB.playerIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[]

  const sortedA = [...playersA].sort((a, b) => rankValue(b) - rankValue(a))
  const sortedB = [...playersB].sort((a, b) => rankValue(b) - rankValue(a))

  const courts: TeamCourtAssignment[] = []
  const perCourt = format === 'doubles' ? 2 : 1

  for (let i = 0; i < totalCourts; i++) {
    const aSlice = sortedA.slice(i * perCourt, i * perCourt + perCourt).map((p) => p.id)
    const bSlice = sortedB.slice(i * perCourt, i * perCourt + perCourt).map((p) => p.id)
    courts.push({
      courtIndex: i,
      teamAPlayerIds: aSlice,
      teamBPlayerIds: bSlice,
      scoreA: null,
      scoreB: null,
      status: 'pending',
    })
  }

  return courts
}

export function buildTeamMatch(teamAId: string, teamBId: string, courts: TeamCourtAssignment[]) {
  return {
    id: generateId(),
    teamAId,
    teamBId,
    courts,
    status: 'active' as const,
    createdAt: Date.now(),
  }
}
