import type { Player, ActiveMatch, CourtConfig, GameResult, FixedPair } from '@/types'
import {
  TEAMMATE_REPEAT_PENALTY,
  OPPONENT_REPEAT_PENALTY,
  RANK_IMBALANCE_FACTOR,
  RECENCY_WINDOW,
  GENERATION_ATTEMPTS,
  SELECTION_WINDOW,
  GAME_COUNT_SKIP_PENALTY,
} from '@/constants'
import { generateId } from '@/utils/id'

interface GenerateParams {
  players: Player[]
  queue: string[]
  courtConfig: CourtConfig
  gameHistory: GameResult[]
  timerDefaultSeconds: number
  occupiedCourtIndices: Set<number>
  pairs: FixedPair[]
  roundNumber: number
  rankBalanceEnabled: boolean
}

const RANK_VALUES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }
const RANK_DEFAULT = 2.5

function today() {
  return new Date().toLocaleDateString('en-CA')
}

function countGamesToday(history: GameResult[], sessionDate: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of history) {
    if (r.sessionDate !== sessionDate) continue
    for (const id of [...r.sideA, ...r.sideB]) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}

function avgRank(ids: string[], playerMap: Map<string, Player>): number {
  const values = ids.map((id) => {
    const rank = playerMap.get(id)?.rank
    return rank ? RANK_VALUES[rank] : RANK_DEFAULT
  })
  return values.reduce((a, b) => a + b, 0) / values.length
}

function scoreAssignment(
  sideA: string[],
  sideB: string[],
  recentHistory: GameResult[],
  playerMap: Map<string, Player>
): number {
  let penalty = 0

  // ── 直近対戦・ペア重複ペナルティ ──
  for (const match of recentHistory) {
    const mA = new Set(match.sideA)
    const mB = new Set(match.sideB)

    if (sideA.length > 1) {
      if (sideA.every((id) => mA.has(id)) || sideA.every((id) => mB.has(id)))
        penalty += TEAMMATE_REPEAT_PENALTY
    }
    if (sideB.length > 1) {
      if (sideB.every((id) => mA.has(id)) || sideB.every((id) => mB.has(id)))
        penalty += TEAMMATE_REPEAT_PENALTY
    }

    const facedAvsB = sideA.some((id) => mB.has(id)) && sideB.some((id) => mA.has(id))
    const facedBvsA = sideB.some((id) => mB.has(id)) && sideA.some((id) => mA.has(id))
    if (facedAvsB || facedBvsA) penalty += OPPONENT_REPEAT_PENALTY
  }

  // ── ランク差ペナルティ（二乗：差が大きいほど急激に増加）──
  const rankDiff = Math.abs(avgRank(sideA, playerMap) - avgRank(sideB, playerMap))
  penalty += rankDiff * rankDiff * RANK_IMBALANCE_FACTOR

  return penalty
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function randomSplitDoubles(group: string[]): [string[], string[]] {
  const shuffled = shuffle(group)
  return [shuffled.slice(0, 2), shuffled.slice(2, 4)]
}

function constrainedSplitDoubles(group: string[], pairs: FixedPair[]): [string[], string[]] {
  for (const pair of pairs) {
    const [p1, p2] = pair.playerIds
    if (group.includes(p1) && group.includes(p2)) {
      const others = group.filter((id) => id !== p1 && id !== p2)
      const shuffledOthers = shuffle(others)
      return Math.random() < 0.5
        ? [[p1, p2], shuffledOthers.slice(0, 2)]
        : [shuffledOthers.slice(0, 2), [p1, p2]]
    }
  }
  return randomSplitDoubles(group)
}

export function generateMatchAssignments(params: GenerateParams): ActiveMatch[] {
  const { players, queue, courtConfig, gameHistory, timerDefaultSeconds, occupiedCourtIndices, pairs, roundNumber, rankBalanceEnabled } = params
  const { totalCourts, format, courtFormats } = courtConfig
  const sessionDate = today()

  const gameCounts = countGamesToday(gameHistory, sessionDate)
  const playerMap = new Map(players.map((p) => [p.id, p]))

  const sorted = [...queue]
    .filter((id) => playerMap.has(id))
    .sort((a, b) => {
      const diff = (gameCounts.get(a) ?? 0) - (gameCounts.get(b) ?? 0)
      if (diff !== 0) return diff
      return (playerMap.get(a)!.createdAt) - (playerMap.get(b)!.createdAt)
    })

  const availableCourts = Array.from({ length: totalCourts }, (_, i) => i)
    .filter((i) => !occupiedCourtIndices.has(i))

  const recentHistory = gameHistory.slice(-RECENCY_WINDOW)
  const results: ActiveMatch[] = []
  let remaining = [...sorted]

  for (const ci of availableCourts) {
    const courtFormat = courtFormats[ci] ?? format
    const ppm = courtFormat === 'doubles' ? 4 : 2

    if (remaining.length < ppm) continue

    // ppm + SELECTION_WINDOW 人を候補プールとして、最もバランスの良い組み合わせを探す
    const pool = remaining.slice(0, Math.min(remaining.length, ppm + SELECTION_WINDOW))

    let bestTotalScore = Infinity
    let bestCandidates = pool.slice(0, ppm)
    let bestSideA = bestCandidates.slice(0, ppm / 2)
    let bestSideB = bestCandidates.slice(ppm / 2)

    // プール内で両メンバーが揃っている固定ペアを探す（ダブルスのみ）
    const activePair = courtFormat === 'doubles'
      ? pairs.find((pair) => pair.playerIds.every((id) => pool.includes(id)))
      : undefined

    for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
      // 固定ペアがプール内に存在する場合、両メンバーを必ず候補に含める
      let candidates: string[]
      if (activePair) {
        const pairIds = activePair.playerIds
        const rest = pool.filter((id) => !pairIds.includes(id))
        const fillers = attempt === 0 ? rest.slice(0, ppm - 2) : shuffle(rest).slice(0, ppm - 2)
        candidates = [...pairIds, ...fillers]
      } else {
        // 最初の試行は必ず strict top-ppm（公平性の基準として）
        candidates = attempt === 0 ? pool.slice(0, ppm) : shuffle(pool).slice(0, ppm)
      }

      // スキップペナルティ：試合数の少ない選手を飛ばすほどコスト増
      const avgIdx =
        candidates.reduce((sum, id) => sum + pool.indexOf(id), 0) / ppm
      const skipPenalty = avgIdx * GAME_COUNT_SKIP_PENALTY

      let sideA: string[]
      let sideB: string[]

      if (courtFormat === 'doubles') {
        ;[sideA, sideB] = constrainedSplitDoubles(candidates, pairs)
      } else {
        sideA = [candidates[0]]
        sideB = [candidates[1]]
      }

      const rankScore = rankBalanceEnabled
        ? scoreAssignment(sideA, sideB, recentHistory, playerMap)
        : 0
      const totalScore = rankScore + skipPenalty

      if (totalScore < bestTotalScore) {
        bestTotalScore = totalScore
        bestCandidates = candidates
        bestSideA = sideA
        bestSideB = sideB
      }

      if (bestTotalScore === 0) break
    }

    results.push({
      id: generateId(),
      courtIndex: ci,
      sideA: { playerIds: bestSideA },
      sideB: { playerIds: bestSideB },
      startedAt: 0,
      timerSeconds: timerDefaultSeconds,
      timerRunning: false,
      scoreA: null,
      scoreB: null,
      roundNumber,
      finished: false,
    })

    // 選ばれた選手をキューから除去（strict top-ppm ではない場合もある）
    const usedSet = new Set(bestCandidates)
    remaining = remaining.filter((id) => !usedSet.has(id))
  }

  return results
}
