import type { Player, ActiveMatch, CourtConfig, GameResult, FixedPair, GenderFormat } from '@/types'
import {
  TEAMMATE_REPEAT_PENALTY,
  OPPONENT_REPEAT_PENALTY,
  RANK_IMBALANCE_FACTOR,
  RANK_VARIANCE_FACTOR,
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

function today(): string {
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

function rankVal(id: string, playerMap: Map<string, Player>): number {
  const rank = playerMap.get(id)?.rank
  return rank ? (RANK_VALUES[rank] ?? RANK_DEFAULT) : RANK_DEFAULT
}

function avgRankVal(ids: string[], playerMap: Map<string, Player>): number {
  return ids.reduce((s, id) => s + rankVal(id, playerMap), 0) / ids.length
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * 有効ペアを収集する（両メンバーが availableSet に存在し、かつ同一プレイヤーの重複を除外）。
 * 登録順優先（greedy）。
 */
function collectActivePairs(pairs: FixedPair[], availableSet: Set<string>): FixedPair[] {
  const result: FixedPair[] = []
  const used = new Set<string>()
  for (const p of pairs) {
    if (p.playerIds.every((id) => availableSet.has(id) && !used.has(id))) {
      result.push(p)
      p.playerIds.forEach((id) => used.add(id))
    }
  }
  return result
}

/**
 * プールを構築する。activePairs の全メンバーを先頭に確保し、size にスライス。
 */
function buildPool(base: string[], activePairs: FixedPair[], size: number): string[] {
  const pairSet = new Set(activePairs.flatMap((p) => p.playerIds))
  const front = activePairs.flatMap((p) => [...p.playerIds]).filter((id) => base.includes(id))
  const rest = base.filter((id) => !pairSet.has(id))
  return [...front, ...rest].slice(0, size)
}

/**
 * ダブルス4人を2サイドに分割する。固定ペアを同サイドに配置することを保証。
 * - 2ペア → pair1 vs pair2
 * - 1ペア → ペアを同サイドに固定、残り2人はランダム配置
 * - 0ペア → 完全ランダム
 */
function splitDoublesIntoSides(candidates: string[], activePairs: FixedPair[]): [string[], string[]] {
  if (activePairs.length >= 2) {
    return Math.random() < 0.5
      ? [[...activePairs[0].playerIds], [...activePairs[1].playerIds]]
      : [[...activePairs[1].playerIds], [...activePairs[0].playerIds]]
  }
  if (activePairs.length === 1) {
    const [p1, p2] = activePairs[0].playerIds
    const others = shuffle(candidates.filter((id) => id !== p1 && id !== p2))
    return Math.random() < 0.5
      ? [[p1, p2], others.slice(0, 2)]
      : [others.slice(0, 2), [p1, p2]]
  }
  const s = shuffle(candidates)
  return [s.slice(0, 2), s.slice(2, 4)]
}

/**
 * 試合割り当てのスコアを計算する（低いほど良い）。
 *
 * ペナルティ構成:
 * - チームメイト/対戦相手の重複: 直近重み付き（新しい試合ほど大きいペナルティ）
 * - チーム間ランク差: 二乗（大きな差を急激に抑制）
 * - チーム内ランク差: 線形（A+D vs B+C のような極端なペアを抑制）
 */
function scoreAssignment(
  sideA: string[],
  sideB: string[],
  recentHistory: GameResult[],
  playerMap: Map<string, Player>,
  rankEnabled: boolean
): number {
  let penalty = 0
  const n = recentHistory.length

  for (let i = 0; i < n; i++) {
    // 古い試合ほど weight が小さい (1/n ～ 1.0)
    const weight = (i + 1) / n
    const { sideA: mA_arr, sideB: mB_arr } = recentHistory[i]
    const mA = new Set(mA_arr)
    const mB = new Set(mB_arr)

    if (sideA.length > 1 && (sideA.every((id) => mA.has(id)) || sideA.every((id) => mB.has(id))))
      penalty += TEAMMATE_REPEAT_PENALTY * weight
    if (sideB.length > 1 && (sideB.every((id) => mA.has(id)) || sideB.every((id) => mB.has(id))))
      penalty += TEAMMATE_REPEAT_PENALTY * weight

    const facedAvsB = sideA.some((id) => mB.has(id)) && sideB.some((id) => mA.has(id))
    const facedBvsA = sideB.some((id) => mB.has(id)) && sideA.some((id) => mA.has(id))
    if (facedAvsB || facedBvsA) penalty += OPPONENT_REPEAT_PENALTY * weight
  }

  if (rankEnabled) {
    // チーム間バランス（二乗: 差が大きいほど急激に増加）
    const rankDiff = Math.abs(avgRankVal(sideA, playerMap) - avgRankVal(sideB, playerMap))
    penalty += rankDiff * rankDiff * RANK_IMBALANCE_FACTOR

    // チーム内ランク差（線形: A+D のような格差ペアを抑制）
    if (sideA.length > 1) {
      const vals = sideA.map((id) => rankVal(id, playerMap))
      penalty += Math.abs(vals[0] - vals[1]) * RANK_VARIANCE_FACTOR
    }
    if (sideB.length > 1) {
      const vals = sideB.map((id) => rankVal(id, playerMap))
      penalty += Math.abs(vals[0] - vals[1]) * RANK_VARIANCE_FACTOR
    }
  }

  return penalty
}

export function generateMatchAssignments(params: GenerateParams): ActiveMatch[] {
  const { players, queue, courtConfig, gameHistory, timerDefaultSeconds, occupiedCourtIndices, pairs, roundNumber, rankBalanceEnabled } = params
  const { totalCourts, format, courtFormats, genderFormat, courtGenderFormats } = courtConfig
  const sessionDate = today()

  const gameCounts = countGamesToday(gameHistory, sessionDate)
  const playerMap = new Map(players.map((p) => [p.id, p]))

  // ゲーム数同数時のtie-breakをランダム化（毎ラウンド同じ人が先頭になるのを防ぐ）
  const tieKey = new Map(queue.map((id) => [id, Math.random()]))
  const sorted = [...queue]
    .filter((id) => playerMap.has(id))
    .sort((a, b) => {
      const diff = (gameCounts.get(a) ?? 0) - (gameCounts.get(b) ?? 0)
      return diff !== 0 ? diff : tieKey.get(a)! - tieKey.get(b)!
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

    const remainingSet = new Set(remaining)

    // ── 性別フィルタ + プール構築 ──
    let pool: string[] = []
    let useMixedMode = false
    let malePool: string[] = []
    let femalePool: string[] = []
    let mixedActivePairs: FixedPair[] = []

    if (courtGenderFmt === 'mens') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      const base = males.length >= ppm ? males : remaining
      pool = buildPool(base, collectActivePairs(pairs, new Set(base)), ppm + SELECTION_WINDOW)

    } else if (courtGenderFmt === 'womens') {
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')
      const base = females.length >= ppm ? females : remaining
      pool = buildPool(base, collectActivePairs(pairs, new Set(base)), ppm + SELECTION_WINDOW)

    } else if (courtGenderFmt === 'mixed' && courtFormat === 'doubles') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')

      if (males.length >= 2 && females.length >= 2) {
        useMixedMode = true

        // 男女ペアのみを対象に有効ペア収集
        const mixedPairCandidates = pairs.filter(({ playerIds: [p1, p2] }) =>
          remainingSet.has(p1) && remainingSet.has(p2) &&
          ((playerMap.get(p1)?.gender === 'male' && playerMap.get(p2)?.gender === 'female') ||
           (playerMap.get(p1)?.gender === 'female' && playerMap.get(p2)?.gender === 'male'))
        )
        mixedActivePairs = collectActivePairs(mixedPairCandidates, remainingSet)

        // malePool[i] と femalePool[i] が同じペアのメンバーになるよう並べる
        const pairedMales = mixedActivePairs.map((p) => p.playerIds.find((id) => playerMap.get(id)?.gender === 'male')!)
        const pairedFemales = mixedActivePairs.map((p) => p.playerIds.find((id) => playerMap.get(id)?.gender === 'female')!)
        const mixedPairSet = new Set([...pairedMales, ...pairedFemales])

        malePool = [...pairedMales, ...males.filter((id) => !mixedPairSet.has(id))].slice(0, 2 + SELECTION_WINDOW)
        femalePool = [...pairedFemales, ...females.filter((id) => !mixedPairSet.has(id))].slice(0, 2 + SELECTION_WINDOW)
      } else {
        pool = buildPool(remaining, collectActivePairs(pairs, remainingSet), ppm + SELECTION_WINDOW)
      }

    } else {
      // any
      pool = buildPool(remaining, collectActivePairs(pairs, remainingSet), ppm + SELECTION_WINDOW)
    }

    // ── プール内の固定ペア（非ミックス用） ──
    const poolActivePairs = !useMixedMode && courtFormat === 'doubles'
      ? collectActivePairs(pairs, new Set(pool))
      : []

    // ── スキップペナルティ基準（remainingの先頭プレイヤーのゲーム数） ──
    const minCount = gameCounts.get(remaining[0]) ?? 0

    // ── 全メンバー確定の場合は side swap 2通りだけ試す ──
    const allFixed = poolActivePairs.length >= 2 || (useMixedMode && mixedActivePairs.length >= 2)
    const maxAttempts = allFixed ? 2 : GENERATION_ATTEMPTS

    // ── 初期値 ──
    let bestScore = Infinity
    let bestCandidates: string[] = useMixedMode
      ? [malePool[0], malePool[1], femalePool[0], femalePool[1]]
      : pool.slice(0, ppm)
    let bestSideA: string[] = useMixedMode
      ? [malePool[0], femalePool[0]]
      : bestCandidates.slice(0, ppm / 2)
    let bestSideB: string[] = useMixedMode
      ? [malePool[1], femalePool[1]]
      : bestCandidates.slice(ppm / 2)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let candidates: string[]
      let sideA: string[]
      let sideB: string[]

      if (useMixedMode) {
        if (mixedActivePairs.length >= 2) {
          // 男女2固定ペア: side を swap するだけ
          const p1m = mixedActivePairs[0].playerIds.find((id) => malePool.includes(id))!
          const p1f = mixedActivePairs[0].playerIds.find((id) => femalePool.includes(id))!
          const p2m = mixedActivePairs[1].playerIds.find((id) => malePool.includes(id))!
          const p2f = mixedActivePairs[1].playerIds.find((id) => femalePool.includes(id))!
          candidates = [p1m, p2m, p1f, p2f]
          ;[sideA, sideB] = attempt === 0
            ? [[p1m, p1f], [p2m, p2f]]
            : [[p2m, p2f], [p1m, p1f]]

        } else if (mixedActivePairs.length === 1) {
          // 男女1固定ペア: ペアを同サイドに固定し、相手を探索
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
          // ペアなし: ランダムに男女各2名を選択
          const pickedMales = attempt === 0 ? malePool.slice(0, 2) : shuffle(malePool).slice(0, 2)
          const pickedFemales = attempt === 0 ? femalePool.slice(0, 2) : shuffle(femalePool).slice(0, 2)
          candidates = [...pickedMales, ...pickedFemales]
          ;[sideA, sideB] = Math.random() < 0.5
            ? [[pickedMales[0], pickedFemales[0]], [pickedMales[1], pickedFemales[1]]]
            : [[pickedMales[1], pickedFemales[1]], [pickedMales[0], pickedFemales[0]]]
        }

      } else if (poolActivePairs.length >= 2) {
        // 非ミックス2固定ペア: side を swap するだけ
        const pair1 = poolActivePairs[0].playerIds
        const pair2 = poolActivePairs[1].playerIds
        candidates = [...pair1, ...pair2]
        ;[sideA, sideB] = attempt === 0
          ? [[...pair1], [...pair2]]
          : [[...pair2], [...pair1]]

      } else if (poolActivePairs.length === 1) {
        // 1固定ペア: ペアを確保しフィラーを探索
        const pairIds = poolActivePairs[0].playerIds
        const rest = pool.filter((id) => !pairIds.includes(id))
        const fillers = attempt === 0 ? rest.slice(0, ppm - 2) : shuffle(rest).slice(0, ppm - 2)
        candidates = [...pairIds, ...fillers]
        ;[sideA, sideB] = splitDoublesIntoSides(candidates, poolActivePairs)

      } else {
        // ペアなし: プールからランダム選択
        candidates = attempt === 0 ? pool.slice(0, ppm) : shuffle(pool).slice(0, ppm)
        if (courtFormat === 'doubles') {
          ;[sideA, sideB] = splitDoublesIntoSides(candidates, [])
        } else {
          sideA = [candidates[0]]
          sideB = [candidates[1]]
        }
      }

      // スキップペナルティ: 最小ゲーム数との差の合計（位置インデックスではなく実ゲーム数差を使用）
      const skipPenalty = candidates.reduce(
        (sum, id) => sum + Math.max(0, (gameCounts.get(id) ?? 0) - minCount),
        0
      ) * GAME_COUNT_SKIP_PENALTY

      const score = scoreAssignment(sideA, sideB, recentHistory, playerMap, rankBalanceEnabled) + skipPenalty

      if (score < bestScore) {
        bestScore = score
        bestCandidates = candidates
        bestSideA = sideA
        bestSideB = sideB
      }

      if (bestScore === 0) break
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
