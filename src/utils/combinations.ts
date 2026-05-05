import type { Player, ActiveMatch, CourtConfig, GameResult, FixedPair, GenderFormat } from '@/types'
import {
  TEAMMATE_REPEAT_PENALTY,
  OPPONENT_REPEAT_PENALTY,
  RANK_IMBALANCE_FACTOR,
  RANK_VARIANCE_FACTOR,
  RECENCY_WINDOW,
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

interface Assignment {
  candidates: string[]
  sideA: string[]
  sideB: string[]
}

const RANK_VALUES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }
const RANK_DEFAULT = 2.5

// ─────────────────────────────────────────────
// 純粋ヘルパー
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// 組み合わせ列挙
// ─────────────────────────────────────────────

/** arr から k 個選ぶ全組み合わせ C(arr, k) を返す */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (k > arr.length) return []
  const result: T[][] = []
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of combinations(arr.slice(i + 1), k - 1)) {
      result.push([arr[i], ...rest])
    }
  }
  return result
}

// ─────────────────────────────────────────────
// 固定ペアヘルパー
// ─────────────────────────────────────────────

/**
 * 有効ペアを収集する。
 * 両メンバーが availableSet に存在し、かつ同一プレイヤーが複数ペアに重複しない（greedy）。
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
 * プールを構築する。activePairs の全メンバーを先頭に優先配置し、size にスライス。
 * ダブルス以外（シングルス）では pairs なしで呼ぶこと。
 */
function buildPool(base: string[], activePairs: FixedPair[], size: number): string[] {
  const pairSet = new Set(activePairs.flatMap((p) => p.playerIds))
  const front = activePairs.flatMap((p) => [...p.playerIds]).filter((id) => base.includes(id))
  const rest = base.filter((id) => !pairSet.has(id))
  return [...front, ...rest].slice(0, size)
}

// ─────────────────────────────────────────────
// スコアリング
// ─────────────────────────────────────────────

/**
 * 試合割り当てのペナルティスコアを計算する（低いほど良い）。
 *
 * - ペア/対戦相手の重複: 直近重み付き（古い試合ほど低ウェイト）
 * - チーム間ランク差: 二乗（大差を急激に抑制）
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
    const weight = (i + 1) / n // 最古=1/n, 最新=1.0
    const { sideA: mA_arr, sideB: mB_arr } = recentHistory[i]
    const mA = new Set(mA_arr)
    const mB = new Set(mB_arr)

    if (sideA.length > 1 && (sideA.every((id) => mA.has(id)) || sideA.every((id) => mB.has(id))))
      penalty += TEAMMATE_REPEAT_PENALTY * weight
    if (sideB.length > 1 && (sideB.every((id) => mA.has(id)) || sideB.every((id) => mB.has(id))))
      penalty += TEAMMATE_REPEAT_PENALTY * weight

    const faced = (sideA.some((id) => mB.has(id)) && sideB.some((id) => mA.has(id))) ||
                  (sideB.some((id) => mB.has(id)) && sideA.some((id) => mA.has(id)))
    if (faced) penalty += OPPONENT_REPEAT_PENALTY * weight
  }

  if (rankEnabled) {
    const rankDiff = Math.abs(avgRankVal(sideA, playerMap) - avgRankVal(sideB, playerMap))
    penalty += rankDiff * rankDiff * RANK_IMBALANCE_FACTOR

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

// ─────────────────────────────────────────────
// 割り当て列挙
// ─────────────────────────────────────────────

/**
 * 4人グループの全サイド分割（最大3通り）を返す。
 * 固定ペアが同サイドに収まらない分割は除外する。
 */
function doubleSplits(four: string[], activePairs: FixedPair[]): Array<[string[], string[]]> {
  const [a, b, c, d] = four
  const all: Array<[string[], string[]]> = [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ]
  return all.filter(([s1, s2]) =>
    activePairs.every(({ playerIds: [p1, p2] }) => {
      // この4人グループに含まれないペアは制約なし
      if (!four.includes(p1) || !four.includes(p2)) return true
      return (s1.includes(p1) && s1.includes(p2)) || (s2.includes(p1) && s2.includes(p2))
    })
  )
}

/**
 * ダブルス（非ミックス）の全割り当てを列挙する。
 *
 * - 2ペア確定: 唯一の4人グループ（1通りの分割）
 * - 1ペア: ペアメンバー固定 + 残り C(rest, 2) × 1通りの分割
 * - 0ペア: C(pool, 4) × 最大3通りの分割
 *
 * pool サイズ = ppm + SELECTION_WINDOW の範囲内で全探索するため
 * ランダムサンプリングより確実に最良解を見つけられる。
 */
function enumerateDoubles(pool: string[], activePairs: FixedPair[]): Assignment[] {
  const out: Assignment[] = []

  if (activePairs.length >= 2) {
    const four = [...activePairs[0].playerIds, ...activePairs[1].playerIds]
    for (const [s1, s2] of doubleSplits(four, activePairs)) {
      out.push({ candidates: four, sideA: s1, sideB: s2 })
    }
    return out
  }

  if (activePairs.length === 1) {
    const [p1, p2] = activePairs[0].playerIds
    const rest = pool.filter((id) => id !== p1 && id !== p2)
    for (const fillers of combinations(rest, 2)) {
      const four = [p1, p2, ...fillers]
      for (const [s1, s2] of doubleSplits(four, activePairs)) {
        out.push({ candidates: four, sideA: s1, sideB: s2 })
      }
    }
    return out
  }

  for (const four of combinations(pool, 4)) {
    for (const [s1, s2] of doubleSplits(four, [])) {
      out.push({ candidates: four, sideA: s1, sideB: s2 })
    }
  }
  return out
}

/**
 * ミックスダブルスの全割り当てを列挙する（各サイドに男1+女1）。
 * malePool[i] と femalePool[i] は同一固定ペアのメンバー（alignment 保証）。
 *
 * - 2固定ペア: 唯一の組み合わせ × 2サイド配置
 * - 1固定ペア: ペア固定 + 相手の全列挙 × 2サイド配置
 * - 0固定ペア: C(malePool, 2) × C(femalePool, 2) × 2サイド配置
 */
function enumerateMixed(
  malePool: string[],
  femalePool: string[],
  mixedActivePairs: FixedPair[]
): Assignment[] {
  const out: Assignment[] = []

  if (mixedActivePairs.length >= 2) {
    const p1m = mixedActivePairs[0].playerIds.find((id) => malePool.includes(id))!
    const p1f = mixedActivePairs[0].playerIds.find((id) => femalePool.includes(id))!
    const p2m = mixedActivePairs[1].playerIds.find((id) => malePool.includes(id))!
    const p2f = mixedActivePairs[1].playerIds.find((id) => femalePool.includes(id))!
    const candidates = [p1m, p2m, p1f, p2f]
    out.push({ candidates, sideA: [p1m, p1f], sideB: [p2m, p2f] })
    out.push({ candidates, sideA: [p2m, p2f], sideB: [p1m, p1f] })
    return out
  }

  if (mixedActivePairs.length === 1) {
    const pairedMale = malePool[0]
    const pairedFemale = femalePool[0]
    for (const om of malePool.slice(1)) {
      for (const of_ of femalePool.slice(1)) {
        const candidates = [pairedMale, om, pairedFemale, of_]
        out.push({ candidates, sideA: [pairedMale, pairedFemale], sideB: [om, of_] })
        out.push({ candidates, sideA: [om, of_], sideB: [pairedMale, pairedFemale] })
      }
    }
    return out
  }

  for (const [m1, m2] of combinations(malePool, 2)) {
    for (const [f1, f2] of combinations(femalePool, 2)) {
      const candidates = [m1, m2, f1, f2]
      out.push({ candidates, sideA: [m1, f1], sideB: [m2, f2] })
      out.push({ candidates, sideA: [m1, f2], sideB: [m2, f1] })
    }
  }
  return out
}

/** シングルスの全割り当てを列挙する（C(pool, 2)）。固定ペアはシングルスでは適用しない。 */
function enumerateSingles(pool: string[]): Assignment[] {
  return combinations(pool, 2).map(([a, b]) => ({
    candidates: [a, b],
    sideA: [a],
    sideB: [b],
  }))
}

// ─────────────────────────────────────────────
// メイン関数
// ─────────────────────────────────────────────

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

    // ── 性別フィルタ + 割り当て列挙 ──
    let assignments: Assignment[]

    if (courtGenderFmt === 'mixed' && courtFormat === 'doubles') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')

      if (males.length >= 2 && females.length >= 2) {
        // 男女ペアのみ対象に有効ペア収集
        const mixedPairCandidates = pairs.filter(({ playerIds: [p1, p2] }) =>
          remainingSet.has(p1) && remainingSet.has(p2) &&
          ((playerMap.get(p1)?.gender === 'male' && playerMap.get(p2)?.gender === 'female') ||
           (playerMap.get(p1)?.gender === 'female' && playerMap.get(p2)?.gender === 'male'))
        )
        const mixedActivePairs = collectActivePairs(mixedPairCandidates, remainingSet)

        const pairedMales = mixedActivePairs.map((p) =>
          p.playerIds.find((id) => playerMap.get(id)?.gender === 'male')!
        )
        const pairedFemales = mixedActivePairs.map((p) =>
          p.playerIds.find((id) => playerMap.get(id)?.gender === 'female')!
        )
        const mixedPairSet = new Set([...pairedMales, ...pairedFemales])

        // malePool[i] と femalePool[i] が同ペアになるよう alignment を保つ
        const malePool = [...pairedMales, ...males.filter((id) => !mixedPairSet.has(id))].slice(0, 2 + SELECTION_WINDOW)
        const femalePool = [...pairedFemales, ...females.filter((id) => !mixedPairSet.has(id))].slice(0, 2 + SELECTION_WINDOW)

        assignments = enumerateMixed(malePool, femalePool, mixedActivePairs)
      } else {
        // 男女どちらかが不足: any と同様にダブルス列挙
        const pool = buildPool(remaining, collectActivePairs(pairs, remainingSet), ppm + SELECTION_WINDOW)
        assignments = enumerateDoubles(pool, collectActivePairs(pairs, new Set(pool)))
      }

    } else if (courtGenderFmt === 'mens') {
      const males = remaining.filter((id) => playerMap.get(id)?.gender === 'male')
      const base = males.length >= ppm ? males : remaining
      const baseSet = new Set(base)
      const pool = courtFormat === 'doubles'
        ? buildPool(base, collectActivePairs(pairs, baseSet), ppm + SELECTION_WINDOW)
        : base.slice(0, ppm + SELECTION_WINDOW)
      assignments = courtFormat === 'doubles'
        ? enumerateDoubles(pool, collectActivePairs(pairs, new Set(pool)))
        : enumerateSingles(pool)

    } else if (courtGenderFmt === 'womens') {
      const females = remaining.filter((id) => playerMap.get(id)?.gender === 'female')
      const base = females.length >= ppm ? females : remaining
      const baseSet = new Set(base)
      const pool = courtFormat === 'doubles'
        ? buildPool(base, collectActivePairs(pairs, baseSet), ppm + SELECTION_WINDOW)
        : base.slice(0, ppm + SELECTION_WINDOW)
      assignments = courtFormat === 'doubles'
        ? enumerateDoubles(pool, collectActivePairs(pairs, new Set(pool)))
        : enumerateSingles(pool)

    } else {
      // any（または mixed で性別不足時のフォールバック以外）
      const pool = courtFormat === 'doubles'
        ? buildPool(remaining, collectActivePairs(pairs, remainingSet), ppm + SELECTION_WINDOW)
        : remaining.slice(0, ppm + SELECTION_WINDOW)
      assignments = courtFormat === 'doubles'
        ? enumerateDoubles(pool, collectActivePairs(pairs, new Set(pool)))
        : enumerateSingles(pool)
    }

    // 有効な割り当てが見つからない場合はコートをスキップ
    if (assignments.length === 0) continue

    // ── 全割り当てをスコアリングし最良を選択 ──
    const minCount = gameCounts.get(remaining[0]) ?? 0
    let bestScore = Infinity
    let best = assignments[0]

    for (const assignment of assignments) {
      // スキップペナルティ: 最小ゲーム数との差の合計（ゲーム数が同じならペナルティ0）
      const skipPenalty = assignment.candidates.reduce(
        (sum, id) => sum + Math.max(0, (gameCounts.get(id) ?? 0) - minCount),
        0
      ) * GAME_COUNT_SKIP_PENALTY

      const score = scoreAssignment(
        assignment.sideA, assignment.sideB, recentHistory, playerMap, rankBalanceEnabled
      ) + skipPenalty

      if (score < bestScore) {
        bestScore = score
        best = assignment
      }
    }

    // サイドA/Bはスコアに影響しないのでランダムに割り当て
    const [outSideA, outSideB] = Math.random() < 0.5
      ? [best.sideA, best.sideB]
      : [best.sideB, best.sideA]

    results.push({
      id: generateId(),
      courtIndex: ci,
      sideA: { playerIds: outSideA },
      sideB: { playerIds: outSideB },
      startedAt: 0,
      timerSeconds: timerDefaultSeconds,
      timerRunning: false,
      scoreA: null,
      scoreB: null,
      roundNumber,
      finished: false,
    })

    const usedSet = new Set(best.candidates)
    remaining = remaining.filter((id) => !usedSet.has(id))
  }

  return results
}
