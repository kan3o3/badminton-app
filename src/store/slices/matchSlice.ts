import type { StateCreator } from 'zustand'
import type { ActiveMatch, GameResult } from '@/types'
import type { PlayerSlice } from './playerSlice'
import type { CourtSlice } from './courtSlice'
import type { HistorySlice } from './historySlice'
import type { PairSlice } from './pairSlice'
import { generateMatchAssignments } from '@/utils/combinations'
import { generateId } from '@/utils/id'

export interface SlotRef {
  kind: 'court'
  courtIndex: number
  side: 'A' | 'B'
  slotIndex: number
}

export interface WaitingRef {
  kind: 'waiting'
  waitingIndex: number
}

export type PlayerRef = SlotRef | WaitingRef

export interface MatchSlice {
  activeMatches: ActiveMatch[]
  waitingQueue: string[]
  currentRound: number
  generateMatches: () => void
  swapPlayers: (from: PlayerRef, to: PlayerRef) => void
  swapPlayersByIds: (idA: string, idB: string) => void
  setScore: (courtIndex: number, scoreA: number | null, scoreB: number | null) => void
  finalizeMatch: (courtIndex: number) => void
  startTimer: (courtIndex: number) => void
  pauseTimer: (courtIndex: number) => void
  resetTimer: (courtIndex: number) => void
  tickTimer: (courtIndex: number, deltaSeconds: number) => void
  initWaitingQueue: () => void
}

type AllSlices = PlayerSlice & CourtSlice & HistorySlice & MatchSlice & PairSlice

export const createMatchSlice: StateCreator<AllSlices, [], [], MatchSlice> = (set, get) => ({
  activeMatches: [],
  waitingQueue: [],
  currentRound: 0,

  initWaitingQueue: () => {
    const { players, waitingQueue, activeMatches } = get()
    const activePlayers = players.filter((p) => p.status === 'active')
    // 進行中（未終了）コートのみ occupied とみなす。終了済コートの選手はキューに残す
    const occupiedIds = new Set(
      activeMatches
        .filter((m) => !m.finished)
        .flatMap((m) => [...m.sideA.playerIds, ...m.sideB.playerIds])
    )
    const existingIds = new Set(waitingQueue)
    const newIds = activePlayers
      .filter((p) => !existingIds.has(p.id) && !occupiedIds.has(p.id))
      .map((p) => p.id)
    const filtered = waitingQueue.filter(
      (id) => activePlayers.some((p) => p.id === id) && !occupiedIds.has(id)
    )
    set({ waitingQueue: [...filtered, ...newIds] })
  },

  generateMatches: () => {
    const { players, courtConfig, gameHistory, waitingQueue, activeMatches, pairs, currentRound } = get()
    const activePlayers = players.filter((p) => p.status === 'active')
    const nextRound = currentRound + 1

    // 未終了の試合を自動クローズして履歴へ記録
    const autoResults: GameResult[] = activeMatches
      .filter((m) => !m.finished)
      .map((m) => {
        const { scoreA, scoreB } = m
        let winningSide: 'A' | 'B' | 'draw' = 'draw'
        if (scoreA !== null && scoreB !== null) {
          if (scoreA > scoreB) winningSide = 'A'
          else if (scoreB > scoreA) winningSide = 'B'
        }
        return {
          id: generateId(),
          courtIndex: m.courtIndex,
          sideA: m.sideA.playerIds,
          sideB: m.sideB.playerIds,
          scoreA,
          scoreB,
          winningSide,
          playedAt: Date.now(),
          sessionDate: new Date().toLocaleDateString('en-CA'),
          roundNumber: m.roundNumber,
        }
      })

    // 全試合の選手をプールへ返す（アクティブな選手のみ）
    const allCurrentIds = new Set(
      activeMatches.flatMap((m) => [...m.sideA.playerIds, ...m.sideB.playerIds])
    )
    const returningIds = [...allCurrentIds].filter(
      (id) => activePlayers.some((p) => p.id === id) && !waitingQueue.includes(id)
    )
    const fullQueue = [
      ...waitingQueue.filter((id) => activePlayers.some((p) => p.id === id)),
      ...returningIds,
    ]

    const updatedHistory = [...gameHistory, ...autoResults]

    // 全コートが空きなので occupiedCourtIndices は空
    const newMatches = generateMatchAssignments({
      players: activePlayers,
      queue: fullQueue,
      courtConfig,
      gameHistory: updatedHistory,
      timerDefaultSeconds: courtConfig.timerDefaultSeconds,
      occupiedCourtIndices: new Set(),
      pairs,
      roundNumber: nextRound,
      rankBalanceEnabled: courtConfig.rankBalanceEnabled ?? true,
    })

    if (newMatches.length === 0) return

    const usedIds = new Set(
      newMatches.flatMap((m) => [...m.sideA.playerIds, ...m.sideB.playerIds])
    )
    const remainingQueue = fullQueue.filter((id) => !usedIds.has(id))

    set({
      activeMatches: newMatches,
      waitingQueue: remainingQueue,
      currentRound: nextRound,
      gameHistory: updatedHistory,
    })
  },

  swapPlayers: (from, to) => {
    set((state) => {
      const matches = state.activeMatches.map((m) => ({
        ...m,
        sideA: { playerIds: [...m.sideA.playerIds] },
        sideB: { playerIds: [...m.sideB.playerIds] },
      }))
      const queue = [...state.waitingQueue]

      const getPlayerId = (ref: PlayerRef): string | null => {
        if (ref.kind === 'waiting') return queue[ref.waitingIndex] ?? null
        const m = matches[ref.courtIndex]
        if (!m) return null
        const side = ref.side === 'A' ? m.sideA : m.sideB
        return side.playerIds[ref.slotIndex] ?? null
      }

      const setPlayerId = (ref: PlayerRef, id: string | null) => {
        if (ref.kind === 'waiting') {
          if (id === null) queue.splice(ref.waitingIndex, 1)
          else queue[ref.waitingIndex] = id
          return
        }
        const m = matches[ref.courtIndex]
        if (!m) return
        const side = ref.side === 'A' ? m.sideA : m.sideB
        if (id === null) side.playerIds.splice(ref.slotIndex, 1)
        else side.playerIds[ref.slotIndex] = id
      }

      const idA = getPlayerId(from)
      const idB = getPlayerId(to)
      setPlayerId(from, idB)
      setPlayerId(to, idA)

      return { activeMatches: matches, waitingQueue: queue }
    })
  },

  swapPlayersByIds: (idA, idB) =>
    set((state) => {
      const matches = state.activeMatches.map((m) => ({
        ...m,
        sideA: { playerIds: [...m.sideA.playerIds] },
        sideB: { playerIds: [...m.sideB.playerIds] },
      }))
      const queue = [...state.waitingQueue]

      const findRef = (id: string): PlayerRef | null => {
        // 進行中コートを先に検索、終了済はキューで見つかる
        for (const m of matches) {
          if (m.finished) continue
          const ai = m.sideA.playerIds.indexOf(id)
          if (ai !== -1) return { kind: 'court', courtIndex: m.courtIndex, side: 'A', slotIndex: ai }
          const bi = m.sideB.playerIds.indexOf(id)
          if (bi !== -1) return { kind: 'court', courtIndex: m.courtIndex, side: 'B', slotIndex: bi }
        }
        const wi = queue.indexOf(id)
        if (wi !== -1) return { kind: 'waiting', waitingIndex: wi }
        return null
      }

      const refA = findRef(idA)
      const refB = findRef(idB)
      if (!refA || !refB) return { activeMatches: matches, waitingQueue: queue }

      const setId = (ref: PlayerRef, id: string) => {
        if (ref.kind === 'waiting') { queue[ref.waitingIndex] = id; return }
        const m = matches[ref.courtIndex]
        const side = ref.side === 'A' ? m.sideA : m.sideB
        side.playerIds[ref.slotIndex] = id
      }
      setId(refA, idB)
      setId(refB, idA)

      return { activeMatches: matches, waitingQueue: queue }
    }),

  setScore: (courtIndex, scoreA, scoreB) =>
    set((state) => ({
      activeMatches: state.activeMatches.map((m) =>
        m.courtIndex === courtIndex ? { ...m, scoreA, scoreB } : m
      ),
    })),

  finalizeMatch: (courtIndex) => {
    const state = get()
    const match = state.activeMatches.find((m) => m.courtIndex === courtIndex)
    if (!match || match.finished) return

    const { scoreA, scoreB } = match
    let winningSide: 'A' | 'B' | 'draw' = 'draw'
    if (scoreA !== null && scoreB !== null) {
      if (scoreA > scoreB) winningSide = 'A'
      else if (scoreB > scoreA) winningSide = 'B'
    }

    const result: GameResult = {
      id: generateId(),
      courtIndex,
      sideA: match.sideA.playerIds,
      sideB: match.sideB.playerIds,
      scoreA,
      scoreB,
      winningSide,
      playedAt: Date.now(),
      sessionDate: new Date().toLocaleDateString('en-CA'),
      roundNumber: match.roundNumber,
    }

    const returnedIds = [...match.sideA.playerIds, ...match.sideB.playerIds]

    set((s) => ({
      activeMatches: s.activeMatches.map((m) =>
        m.courtIndex === courtIndex ? { ...m, finished: true, timerRunning: false } : m
      ),
      waitingQueue: [...s.waitingQueue, ...returnedIds],
      gameHistory: [...s.gameHistory, result],
    }))
  },

  startTimer: (courtIndex) =>
    set((state) => ({
      activeMatches: state.activeMatches.map((m) =>
        m.courtIndex === courtIndex
          ? { ...m, timerRunning: true, startedAt: m.startedAt || Date.now() }
          : m
      ),
    })),

  pauseTimer: (courtIndex) =>
    set((state) => ({
      activeMatches: state.activeMatches.map((m) =>
        m.courtIndex === courtIndex ? { ...m, timerRunning: false } : m
      ),
    })),

  resetTimer: (courtIndex) =>
    set((state) => ({
      activeMatches: state.activeMatches.map((m) =>
        m.courtIndex === courtIndex
          ? {
              ...m,
              timerRunning: false,
              timerSeconds: state.courtConfig.timerDefaultSeconds,
              startedAt: 0,
            }
          : m
      ),
    })),

  tickTimer: (courtIndex, deltaSeconds) =>
    set((state) => ({
      activeMatches: state.activeMatches.map((m) => {
        if (m.courtIndex !== courtIndex || !m.timerRunning) return m
        const next = Math.max(0, m.timerSeconds - deltaSeconds)
        return { ...m, timerSeconds: next, timerRunning: next > 0 }
      }),
    })),
})
