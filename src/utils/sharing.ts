import type { GameResult, Player, PlayerStats } from '@/types'

const MAX_GAMES_PER_PLAYER = 10

function playerName(id: string, players: Player[]): string {
  return players.find((p) => p.id === id)?.name ?? '不明'
}

function sideNames(ids: string[], players: Player[]): string {
  return ids.map((id) => playerName(id, players)).join('・')
}

function formatScore(a: number | null, b: number | null): string {
  return a !== null && b !== null ? `${a}-${b}` : 'スコアなし'
}

function winRateStr(s: PlayerStats): string {
  return s.wins + s.losses > 0 ? `勝率${Math.round(s.winRate * 100)}%` : '勝率−%'
}

export function generateShareText(
  history: GameResult[],
  players: Player[],
  stats: PlayerStats[],
  dateLabel: string,
  sessionDate: string
): string {
  const sorted = [...history].sort((a, b) => a.playedAt - b.playedAt)

  // ── 試合結果 ──
  const matchLines: string[] = [`【試合結果】`]
  if (sorted.length === 0) {
    matchLines.push('  試合履歴がありません')
  } else {
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i]
      const sA = sideNames(r.sideA, players)
      const sB = sideNames(r.sideB, players)
      const sc = formatScore(r.scoreA, r.scoreB)

      let result: string
      if (r.winningSide === 'A') result = `${sc} 🏆${sA}`
      else if (r.winningSide === 'B') result = `${sc} 🏆${sB}`
      else result = `${sc} 引き分け`

      matchLines.push(`第${i + 1}試合 コート${r.courtIndex + 1}`)
      matchLines.push(`  ${sA} vs ${sB}`)
      matchLines.push(`  ${result}`)
    }
  }

  // ── 順位 ──
  const rankLines: string[] = [`【順位】（${dateLabel}）`]
  const ranked = [...stats]
    .filter((s) => s.gamesPlayed > 0)
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)

  if (ranked.length === 0) {
    rankLines.push('  データなし')
  } else {
    for (let i = 0; i < ranked.length; i++) {
      const s = ranked[i]
      const name = playerName(s.playerId, players)
      rankLines.push(`${i + 1}位 ${name}  ${s.gamesPlayed}試合 ${s.wins}勝 ${winRateStr(s)}`)
    }
  }

  // ── 選手別の戦績 ──
  const detailLines: string[] = [`【選手別の戦績】`]
  const participatingStats = stats.filter((s) => s.gamesPlayed > 0)

  for (const s of participatingStats) {
    const id = s.playerId
    const name = playerName(id, players)
    const myMatches = sorted.filter((r) => r.sideA.includes(id) || r.sideB.includes(id))

    detailLines.push(`${name}: ${s.gamesPlayed}試合 ${s.wins}勝${s.losses}敗`)

    const shown = myMatches.slice(0, MAX_GAMES_PER_PLAYER)
    for (const r of shown) {
      const onA = r.sideA.includes(id)
      const myIds = onA ? r.sideA : r.sideB
      const theirIds = onA ? r.sideB : r.sideA
      const teammates = myIds.filter((mid) => mid !== id)
      const opponent = sideNames(theirIds, players)
      const sc = formatScore(r.scoreA, r.scoreB)

      let icon: string
      if (r.scoreA === null || r.scoreB === null) icon = '△'
      else if (r.winningSide === 'draw') icon = '△'
      else if ((r.winningSide === 'A' && onA) || (r.winningSide === 'B' && !onA)) icon = '✅'
      else icon = '❌'

      const matchDesc =
        teammates.length > 0
          ? `${sideNames(teammates, players)}と組んで${opponent}に ${sc}`
          : `${opponent}に ${sc}`

      detailLines.push(`  ${icon} ${matchDesc}`)
    }

    const remaining = myMatches.length - shown.length
    if (remaining > 0) detailLines.push(`  ...他${remaining}試合`)
  }

  const header = `📅 ${sessionDate} 練習結果（${dateLabel}）`
  return [header, '', matchLines.join('\n'), '', rankLines.join('\n'), '', detailLines.join('\n')].join('\n')
}
