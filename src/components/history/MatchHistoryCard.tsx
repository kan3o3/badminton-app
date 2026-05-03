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
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-400">コート {result.courtIndex + 1}</span>
        <div className="flex items-center gap-2">
          {!editing && hasScore && (
            <span className="text-sm font-bold text-gray-700">{result.scoreA} − {result.scoreB}</span>
          )}
          {!editing && !hasScore && (
            <span className="text-xs text-gray-300">スコアなし</span>
          )}
          <span className="text-xs text-gray-300">{formatTime(result.playedAt)}</span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded-lg hover:bg-gray-100"
            >
              編集
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 text-sm">
        <div className={`flex-1 flex items-center gap-1 ${winA && !editing ? 'font-bold text-green-700' : 'text-gray-600'}`}>
          {winA && !editing && <span className="text-xs">🏆</span>}
          <span>{names(result.sideA, players)}</span>
        </div>
        <span className="text-xs font-bold text-gray-300 shrink-0">VS</span>
        <div className={`flex-1 flex items-center justify-end gap-1 ${winB && !editing ? 'font-bold text-green-700' : 'text-gray-600'}`}>
          <span>{names(result.sideB, players)}</span>
          {winB && !editing && <span className="text-xs">🏆</span>}
        </div>
      </div>

      {editing && (
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-2.5">
          <input
            type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)}
            placeholder="0" min={0} max={99}
            className="w-12 text-center border border-gray-200 rounded-xl py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
          />
          <span className="text-gray-300 text-sm font-bold">−</span>
          <input
            type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)}
            placeholder="0" min={0} max={99}
            className="w-12 text-center border border-gray-200 rounded-xl py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
          />
          <button
            onClick={handleSave}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl font-medium"
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
