import type { Player, GameResult, PlayerStats } from '@/types'

export function computePlayerStats(history: GameResult[], players: Player[]): PlayerStats[] {
  return players.map((player) => {
    const id = player.id
    let gamesPlayed = 0
    let wins = 0
    let losses = 0
    let draws = 0
    let pointsFor = 0
    let pointsAgainst = 0

    for (const r of history) {
      const onA = r.sideA.includes(id)
      const onB = r.sideB.includes(id)
      if (!onA && !onB) continue

      gamesPlayed++

      if (r.scoreA !== null && r.scoreB !== null) {
        const myScore = onA ? r.scoreA : r.scoreB
        const theirScore = onA ? r.scoreB : r.scoreA
        pointsFor += myScore
        pointsAgainst += theirScore

        if (r.winningSide === 'draw') draws++
        else if ((r.winningSide === 'A' && onA) || (r.winningSide === 'B' && onB)) wins++
        else losses++
      } else {
        draws++
      }
    }

    const scoredGames = wins + losses
    return {
      playerId: id,
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate: scoredGames > 0 ? wins / scoredGames : 0,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
    }
  })
}
