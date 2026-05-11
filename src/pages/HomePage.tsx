import { useEffect, useMemo, useState } from 'react'
import useAppStore from '@/store/useAppStore'
import CourtCard from '@/components/courts/CourtCard'
import WaitingList from '@/components/matches/WaitingList'
import MatchHistoryCard from '@/components/history/MatchHistoryCard'
import Button from '@/components/common/Button'
import { useTimer } from '@/hooks/useTimer'

export default function HomePage() {
  useTimer()

  const players = useAppStore((s) => s.players)
  const activeMatches = useAppStore((s) => s.activeMatches)
  const waitingQueue = useAppStore((s) => s.waitingQueue)
  const generateMatches = useAppStore((s) => s.generateMatches)
  const initWaitingQueue = useAppStore((s) => s.initWaitingQueue)
  const courtConfig = useAppStore((s) => s.courtConfig)
  const gameHistory = useAppStore((s) => s.gameHistory)
  const sessionDate = useAppStore((s) => s.sessionDate)
  const swapPlayersByIds = useAppStore((s) => s.swapPlayersByIds)
  const swapHistoryPlayers = useAppStore((s) => s.swapHistoryPlayers)
  const currentRound = useAppStore((s) => s.currentRound)

  const [swapMode, setSwapMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewRound, setViewRound] = useState(0)
  const [historySwapMode, setHistorySwapMode] = useState(false)
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(null)

  useEffect(() => {
    setViewRound(currentRound)
  }, [currentRound])

  useEffect(() => {
    setHistorySwapMode(false)
    setHistorySelectedId(null)
  }, [viewRound])

  useEffect(() => {
    initWaitingQueue()
  }, [initWaitingQueue])

  useEffect(() => {
    if (swapMode) {
      setSwapMode(false)
      setSelectedId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatches.length])

  const gameCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of gameHistory) {
      if (r.sessionDate !== sessionDate) continue
      for (const id of [...r.sideA, ...r.sideB]) {
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
    return counts
  }, [gameHistory, sessionDate])

  const activePlayers = players.filter((p) => p.status === 'active')
  const runningMatches = activeMatches.filter((m) => !m.finished)
  const occupiedIds = new Set(
    runningMatches.flatMap((m) => [...m.sideA.playerIds, ...m.sideB.playerIds])
  )
  const availableInQueue = waitingQueue.filter(
    (id) => !occupiedIds.has(id) && activePlayers.some((p) => p.id === id)
  )
  const minPpm = Array.from({ length: courtConfig.totalCourts }, (_, i) =>
    (courtConfig.courtFormats[i] ?? courtConfig.format) === 'doubles' ? 4 : 2
  ).reduce((a: number, b: number) => Math.min(a, b), 4)
  const unfinishedWithoutScore = (courtConfig.requireScore ?? false)
    ? runningMatches.filter((m) => m.scoreA === null || m.scoreB === null)
    : []
  const canGenerate = activePlayers.length >= minPpm && unfinishedWithoutScore.length === 0
  const hasAnyPlayers = activeMatches.length > 0 || availableInQueue.length > 0

  const handleSelectPlayer = (id: string) => {
    if (selectedId === null) {
      setSelectedId(id)
    } else if (selectedId === id) {
      setSelectedId(null)
    } else {
      swapPlayersByIds(selectedId, id)
      setSelectedId(null)
    }
  }

  const toggleSwapMode = () => {
    setSwapMode((v) => !v)
    setSelectedId(null)
  }

  const toggleHistorySwapMode = () => {
    setHistorySwapMode((v) => !v)
    setHistorySelectedId(null)
  }

  const handleHistorySelectPlayer = (id: string) => {
    if (historySelectedId === null) {
      setHistorySelectedId(id)
    } else if (historySelectedId === id) {
      setHistorySelectedId(null)
    } else {
      swapHistoryPlayers(viewRound, historySelectedId, id)
      setHistorySelectedId(null)
    }
  }

  const isViewingCurrent = viewRound === currentRound || currentRound === 0

  const historyForRound = useMemo(
    () => gameHistory
      .filter((r) => r.sessionDate === sessionDate && r.roundNumber === viewRound)
      .sort((a, b) => a.courtIndex - b.courtIndex),
    [gameHistory, sessionDate, viewRound]
  )

  const sortedMatches = activeMatches.slice().sort((a, b) => a.courtIndex - b.courtIndex)

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-lg font-bold text-gray-800">試合管理</h1>
        <div className="flex gap-2">
          {hasAnyPlayers && isViewingCurrent && (
            <Button
              variant={swapMode ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleSwapMode}
            >
              {swapMode ? '✕ キャンセル' : '⇄ 入替'}
            </Button>
          )}
          {!isViewingCurrent && historyForRound.length > 0 && (
            <Button
              variant={historySwapMode ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleHistorySwapMode}
            >
              {historySwapMode ? '✕ キャンセル' : '⇄ 入替'}
            </Button>
          )}
          {!swapMode && isViewingCurrent && (
            <Button
              onClick={generateMatches}
              disabled={!canGenerate}
              size="sm"
              title={unfinishedWithoutScore.length > 0 ? 'スコアを入力してから生成してください' : undefined}
            >
              🏸 生成
            </Button>
          )}
        </div>
      </div>

      {/* ── ラウンドナビゲーション ── */}
      {currentRound > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setViewRound((v) => Math.max(1, v - 1))}
            disabled={viewRound <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5 bg-white shadow-sm rounded-2xl px-4 py-1.5">
            <span className="text-sm font-bold text-gray-700">第 {viewRound} 回</span>
            {isViewingCurrent && (
              <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">現在</span>
            )}
          </div>
          <button
            onClick={() => setViewRound((v) => Math.min(currentRound, v + 1))}
            disabled={viewRound >= currentRound}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
          >
            ›
          </button>
        </div>
      )}

      {/* ── 生成不可ヒント ── */}
      {!canGenerate && isViewingCurrent && !swapMode && activeMatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-700">
          {unfinishedWithoutScore.length > 0
            ? `スコア未入力のコートがあります（${unfinishedWithoutScore.length}コート）`
            : `参加中 ${activePlayers.length}人（最低${minPpm}人必要）`}
        </div>
      )}

      {/* ── 入れ替えガイド ── */}
      {(swapMode || historySwapMode) && (
        <div className="bg-blue-500 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
          <span className="text-white text-lg">👆</span>
          <span className="text-white text-sm font-medium">
            {(swapMode ? selectedId : historySelectedId)
              ? '入れ替え先の選手をタップ（同じ選手で解除）'
              : '入れ替えたい選手をタップ'}
          </span>
        </div>
      )}

      {/* ── 過去ラウンド表示 ── */}
      {!isViewingCurrent && (
        <>
          {historyForRound.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-gray-400 text-sm">第{viewRound}回の試合結果はありません</p>
            </div>
          ) : (
            historyForRound.map((r) => (
              <MatchHistoryCard
                key={r.id}
                result={r}
                players={players}
                swapMode={historySwapMode}
                selectedId={historySelectedId}
                onSelectPlayer={handleHistorySelectPlayer}
              />
            ))
          )}
          <button
            onClick={() => setViewRound(currentRound)}
            className="text-sm text-green-600 font-semibold text-center py-2 hover:underline"
          >
            現在の試合へ戻る →
          </button>
        </>
      )}

      {/* ── 現在ラウンド表示 ── */}
      {isViewingCurrent && (
        <>
          {activeMatches.length === 0 && !swapMode && (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-3xl mb-3">🏸</p>
              <p className="text-gray-500 text-sm font-medium">
                {activePlayers.length < minPpm
                  ? `選手管理で ${minPpm}人以上を「参加中」にしてください`
                  : '「生成」ボタンで試合を割り当てます'}
              </p>
            </div>
          )}

          {sortedMatches.map((match) => (
            <CourtCard
              key={match.id}
              match={match}
              players={players}
              swapMode={swapMode}
              selectedId={selectedId}
              onSelectPlayer={handleSelectPlayer}
            />
          ))}

          <WaitingList
            playerIds={availableInQueue}
            players={players}
            gameCounts={gameCounts}
            swapMode={swapMode}
            selectedId={selectedId}
            onSelectPlayer={handleSelectPlayer}
          />
        </>
      )}
    </div>
  )
}
