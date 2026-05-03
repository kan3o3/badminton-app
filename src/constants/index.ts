export const TEAMMATE_REPEAT_PENALTY = 100
export const OPPONENT_REPEAT_PENALTY = 50
export const RANK_IMBALANCE_FACTOR = 80   // quadratic: diff^2 * factor
export const RECENCY_WINDOW = 10
export const GENERATION_ATTEMPTS = 50
export const SELECTION_WINDOW = 2         // strict top-ppm の外から何人まで候補に含めるか
export const GAME_COUNT_SKIP_PENALTY = 20 // 試合数の少ない選手を飛ばした際のコスト（インデックス平均 × 係数）
export const GENDER_MISMATCH_PENALTY = 80 // ダブルス：指定形式とチーム構成が合わない場合
export const GENDER_SINGLES_PENALTY = 40  // シングルス：異性対戦の場合

export const RANK_LABELS: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

export const STATUS_LABELS: Record<string, string> = {
  active: '参加中',
  resting: '休憩中',
  absent: '不参加',
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  resting: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-gray-100 text-gray-500',
}
