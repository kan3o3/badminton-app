import type { Player, ActiveMatch, CourtConfig, GameResult, FixedPair, GenderFormat } from '@/types'
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
  playerMap: Map<string, Player>,
  rankEnabled: boolean
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
  if (rankEnabled) {
    const rankDiff = Math.abs(avgRank(sideA, playerMap) - avgRank(sideB, playerMap))
    penalty += rankDiff * rankDiff * RANK_IMBALANCE_FACTOR
  }

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
  const { totalCourts, format, courtFormats, genderFormat, courtGenderFormats } = courtConfig
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
    const courtGenderFmt: GenderFormat = (courtGenderFormats ?? [])[ci] ?? (genderFormat ?? 'any')
    const ppm = courtFormat === 'doubles' ? 4 : 2

    if (remaining.length < ppm) continue

    // ── 固定ペアを remaining から検索（モード共通） ──
    // 両メンバーが remaining にいる場合のみ有効
    const activePairInRemaining = pairs.find((p) =>
      p.playerIds.every((id) => remaining.includes(id))
    )

    // ── 性別ハード制約によるプール絞り込み ──
    let pool: string[]
    let useMixedMode = false
    let malePool: string[] = []
    let femalePool: string[] = []
    let mixedActivePair: FixedPair | undefined

    // 固定ペアメンバーをリスト先頭に移動してスライスするヘルパー
    function buildPoolWithPair(base: string[], pairIds: readonly string[], size: number): string[] {
      const rest = base.filter((id) => !pairIds.includes(id))
      return [...pairIds, ...rest].slice(0, size)
    }

    if (courtGenderFmt === 'mens') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      if (males.length >= ppm) {
        const pairInMales = activePairInRemaining?.playerIds.every((id) => males.includes(id))
          ? activePairInRemaining : undefined
        pool = pairInMales
          ? buildPoolWithPair(males, pairInMales.playerIds, ppm + SELECTION_WINDOW)
          : males.slice(0, ppm + SELECTION_WINDOW)
      } else {
        pool = remaining.slice(0, ppm + SELECTION_WINDOW)
      }
    } else if (courtGenderFmt === 'womens') {
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')
      if (females.length >= ppm) {
        const pairInFemales = activePairInRemaining?.playerIds.every((id) => females.includes(id))
          ? activePairInRemaining : undefined
        pool = pairInFemales
          ? buildPoolWithPair(females, pairInFemales.playerIds, ppm + SELECTION_WINDOW)
          : females.slice(0, ppm + SELECTION_WINDOW)
      } else {
        pool = remaining.slice(0, ppm + SELECTION_WINDOW)
      }
    } else if (courtGenderFmt === 'mixed' && courtFormat === 'doubles') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')
      if (males.length >= 2 && females.length >= 2) {
        useMixedMode = true
        // pairs 全体から男女ペアを直接探す（activePairInRemaining は同性ペアかもしれないため使わない）
        mixedActivePair = pairs.find((p) => {
          const [p1, p2] = p.playerIds
          return (males.includes(p1) && females.includes(p2)) ||
                 (females.includes(p1) && males.includes(p2))
        })
        if (mixedActivePair) {
          const [p1, p2] = mixedActivePair.playerIds
          const pairedMale = males.includes(p1) ? p1 : p2
          const pairedFemale = females.includes(p1) ? p1 : p2
          malePool = [pairedMale, ...males.filter((id) => id !== pairedMale)].slice(0, 2 + SELECTION_WINDOW)
          femalePool = [pairedFemale, ...females.filter((id) => id !== pairedFemale)].slice(0, 2 + SELECTION_WINDOW)
        } else {
          malePool = males.slice(0, 2 + SELECTION_WINDOW)
          femalePool = females.slice(0, 2 + SELECTION_WINDOW)
        }
        pool = []
      } else {
        pool = remaining.slice(0, ppm + SELECTION_WINDOW)
      }
    } else {
      // any: 固定ペアがいれば先頭に確保
      pool = activePairInRemaining
        ? buildPoolWithPair(remaining, activePairInRemaining.playerIds, ppm + SELECTION_WINDOW)
        : remaining.slice(0, ppm + SELECTION_WINDOW)
    }

    // ── 初期値設定 ──
    let bestTotalScore = Infinity
    let bestCandidates: string[]
    let bestSideA: string[]
    let bestSideB: string[]

    if (useMixedMode) {
      bestCandidates = [malePool[0], malePool[1], femalePool[0], femalePool[1]]
      bestSideA = [malePool[0], femalePool[0]]
      bestSideB = [malePool[1], femalePool[1]]
    } else {
      bestCandidates = pool.slice(0, ppm)
      bestSideA = bestCandidates.slice(0, ppm / 2)
      bestSideB = bestCandidates.slice(ppm / 2)
    }

    // 非ミックスダブルス用固定ペア
    const activePair = !useMixedMode && courtFormat === 'doubles'
      ? pairs.find((pair) => pair.playerIds.every((id) => pool.includes(id)))
      : undefined

    for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
      let candidates: string[]
      let sideA: string[]
      let sideB: string[]

      if (useMixedMode) {
        if (mixedActivePair) {
          // 固定ペア（男女）を同サイドに強制配置（プール先頭にペアメンバー確保済み）
          const pairedMale = malePool[0]
          const pairedFemale = femalePool[0]
          const otherMale = attempt === 0
            ? malePool[1]
            : shuffle(malePool.slice(1))[0] ?? malePool[1]
          const otherFemale = attempt === 0
            ? femalePool[1]
            : shuffle(femalePool.slice(1))[0] ?? femalePool[1]
          candidates = [pairedMale, otherMale, pairedFemale, otherFemale]
          ;[sideA, sideB] = Math.random() < 0.5
            ? [[pairedMale, pairedFemale], [otherMale, otherFemale]]
            : [[otherMale, otherFemale], [pairedMale, pairedFemale]]
        } else {
          // ミックスダブルス：1男 + 1女 を各サイドに確保
          const pickedMales = attempt === 0 ? malePool.slice(0, 2) : shuffle(malePool).slice(0, 2)
          const pickedFemales = attempt === 0 ? femalePool.slice(0, 2) : shuffle(femalePool).slice(0, 2)
          candidates = [...pickedMales, ...pickedFemales]
          sideA = [pickedMales[0], pickedFemales[0]]
          sideB = [pickedMales[1], pickedFemales[1]]
        }
      } else if (activePair) {
        // 固定ペアを両メンバー強制包含
        const pairIds = activePair.playerIds
        const rest = pool.filter((id) => !pairIds.includes(id))
        const fillers = attempt === 0 ? rest.slice(0, ppm - 2) : shuffle(rest).slice(0, ppm - 2)
        candidates = [...pairIds, ...fillers]
        ;[sideA, sideB] = constrainedSplitDoubles(candidates, pairs)
      } else {
        candidates = attempt === 0 ? pool.slice(0, ppm) : shuffle(pool).slice(0, ppm)
        if (courtFormat === 'doubles') {
          ;[sideA, sideB] = constrainedSplitDoubles(candidates, pairs)
        } else {
          sideA = [candidates[0]]
          sideB = [candidates[1]]
        }
      }

      // スキップペナルティ：remaining 内の順位で計算
      const avgIdx =
        candidates.reduce((sum, id) => sum + remaining.indexOf(id), 0) / ppm
      const skipPenalty = avgIdx * GAME_COUNT_SKIP_PENALTY

      const score = scoreAssignment(sideA, sideB, recentHistory, playerMap, rankBalanceEnabled)
      const totalScore = score + skipPenalty

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

    const usedSet = new Set(bestCandidates)
    remaining = remaining.filter((id) => !usedSet.has(id))
  }

  return results
}
