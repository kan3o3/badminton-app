import { useState } from 'react'
import type { GameResult, Player } from '@/types'
import useAppStore from '@/store/useAppStore'

interface MatchHistoryCardProps {
  result: GameResult
  players: Player[]
}

function names(ids: string[], players: Player[]) {
  return ids.map((id) => players.find((p) => p.id === id)?.name ?? '不明').join(' / ')
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export default function MatchHistoryCard({ result, players }: MatchHistoryCardProps) {
  const updateGameResult = useAppStore((s) => s.updateGameResult)
  const [editing, setEditing] = useState(false)
  const [scoreA, setScoreA] = useState(result.scoreA !== null ? String(result.scoreA) : '')
  const [scoreB, setScoreB] = useState(result.scoreB !== null ? String(result.scoreB) : '')

  const hasScore = result.scoreA !== null && result.scoreB !== null
  const winA = result.winningSide === 'A'
  const winB = result.winningSide === 'B'

  const handleSave = () => {
    const a = scoreA === '' ? null : parseInt(scoreA, 10)
    const b = scoreB === '' ? null : parseInt(scoreB, 10)
    updateGameResult(result.id, a, b)
    setEditing(false)
  }

  const handleCancel = () => {
    setScoreA(result.scoreA !== null ? String(result.scoreA) : '')
    setScoreB(result.scoreB !== null ? String(result.scoreB) : '')
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">

      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">コート {result.courtIndex + 1}</span>
          <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
            第{result.roundNumber}回
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatTime(result.playedAt)}</span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border shadow-sm transition-colors ${
                hasScore
                  ? 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  : 'bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100'
              }`}
            >
              <span>✏️</span>
              <span>{hasScore ? 'スコア編集' : 'スコア入力'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── チーム・スコア行 ── */}
      <div className="flex items-center px-4 py-3 gap-2">
        {/* チームA */}
        <div className={`flex-1 flex items-center gap-1.5 ${winA ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
          {winA && <span className="text-base leading-none">🏆</span>}
          <span className="text-sm">{names(result.sideA, players)}</span>
        </div>

        {/* スコア（中央） */}
        <div className="shrink-0 flex items-center gap-1.5 px-3">
          {hasScore ? (
            <>
              <span className={`text-lg font-bold tabular-nums ${winA ? 'text-green-600' : 'text-gray-700'}`}>
                {result.scoreA}
              </span>
              <span className="text-gray-300 font-bold">−</span>
              <span className={`text-lg font-bold tabular-nums ${winB ? 'text-green-600' : 'text-gray-700'}`}>
                {result.scoreB}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-200">VS</span>
          )}
        </div>

        {/* チームB */}
        <div className={`flex-1 flex items-center justify-end gap-1.5 ${winB ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
          <span className="text-sm text-right">{names(result.sideB, players)}</span>
          {winB && <span className="text-base leading-none">🏆</span>}
        </div>
      </div>

      {/* ── 編集パネル ── */}
      {editing && (
        <div className="flex items-center gap-2 px-4 pb-3 pt-2 border-t border-gray-100">
          <input
            type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)}
            placeholder="0" min={0} max={99}
            className="w-14 text-center border border-gray-200 rounded-xl py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
          />
          <span className="text-gray-300 font-bold">−</span>
          <input
            type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)}
            placeholder="0" min={0} max={99}
            className="w-14 text-center border border-gray-200 rounded-xl py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
          />
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:bg-green-800"
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl text-lg"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
