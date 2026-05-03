export type PlayerStatus = 'active' | 'resting' | 'absent'
export type SkillRank = 'A' | 'B' | 'C' | 'D' | null
export type MatchFormat = 'doubles' | 'singles'
export type Gender = 'male' | 'female' | null
export type GenderFormat = 'any' | 'mens' | 'womens' | 'mixed'

export interface Player {
  id: string
  name: string
  status: PlayerStatus
  rank: SkillRank
  gender: Gender
  createdAt: number
}

export interface FixedPair {
  id: string
  playerIds: [string, string]
}

export interface CourtSide {
  playerIds: string[]
}

export interface ActiveMatch {
  id: string
  courtIndex: number
  sideA: CourtSide
  sideB: CourtSide
  startedAt: number
  timerSeconds: number
  timerRunning: boolean
  scoreA: number | null
  scoreB: number | null
  roundNumber: number
  finished: boolean
}

export interface CourtConfig {
  totalCourts: number
  format: MatchFormat
  timerDefaultSeconds: number
  courtFormats: MatchFormat[]  // インデックス = courtIndex。未設定は format にフォールバック
  rankBalanceEnabled: boolean
  genderFormat: GenderFormat          // デフォルト性別形式
  courtGenderFormats: GenderFormat[]  // インデックス = courtIndex。未設定は genderFormat にフォールバック
}

export interface GameResult {
  id: string
  courtIndex: number
  sideA: string[]
  sideB: string[]
  scoreA: number | null
  scoreB: number | null
  winningSide: 'A' | 'B' | 'draw'
  playedAt: number
  sessionDate: string
  roundNumber: number
}

export type TeamColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'

export interface Team {
  id: string
  name: string
  color: TeamColor
  playerIds: string[]
}

export interface TeamCourtAssignment {
  courtIndex: number
  teamAPlayerIds: string[]
  teamBPlayerIds: string[]
  scoreA: number | null
  scoreB: number | null
  status: 'pending' | 'done'
}

export interface TeamMatch {
  id: string
  teamAId: string
  teamBId: string
  courts: TeamCourtAssignment[]
  status: 'active' | 'completed'
  createdAt: number
}

export interface PlayerStats {
  playerId: string
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  pointsFor: number
  pointsAgainst: number
  pointDiff: number
}
