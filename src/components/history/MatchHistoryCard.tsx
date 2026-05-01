import type { GameResult, Player } from '@/types'

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
  const hasScore = result.scoreA !== null && result.scoreB !== null
  const winA = result.winningSide === 'A'
  const winB = result.winningSide === 'B'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-400">コート {result.courtIndex + 1}</span>
        <div className="flex items-center gap-2">
          {hasScore && (
            <span className="text-sm font-bold text-gray-700">{result.scoreA} − {result.scoreB}</span>
          )}
          <span className="text-xs text-gray-300">{formatTime(result.playedAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 text-sm">
        <div className={`flex-1 flex items-center gap-1 ${winA ? 'font-bold text-green-700' : 'text-gray-600'}`}>
          {winA && <span className="text-xs">🏆</span>}
          <span>{names(result.sideA, players)}</span>
        </div>
        <span className="text-xs font-bold text-gray-300 shrink-0">VS</span>
        <div className={`flex-1 flex items-center justify-end gap-1 ${winB ? 'font-bold text-green-700' : 'text-gray-600'}`}>
          <span>{names(result.sideB, players)}</span>
          {winB && <span className="text-xs">🏆</span>}
        </div>
      </div>
    </div>
  )
}
