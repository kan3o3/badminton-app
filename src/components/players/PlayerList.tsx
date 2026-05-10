import { useState } from 'react'
import type { Player, PlayerStatus } from '@/types'
import PlayerCard from './PlayerCard'
import { usePlayerNumbers } from '@/hooks/usePlayerNumbers'

type SortBy = 'createdAt' | 'name' | 'rank' | 'games'

const RANK_ORDER: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }

interface PlayerListProps {
  players: Player[]
  gameCounts: Map<string, number>
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  onStatusChange: (id: string, status: PlayerStatus) => void
}

const filters: { value: 'all' | PlayerStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '参加中' },
  { value: 'resting', label: '休憩中' },
  { value: 'absent', label: '不参加' },
]

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: '登録順' },
  { value: 'name', label: '名前順' },
  { value: 'rank', label: 'ランク順' },
  { value: 'games', label: '試合数順' },
]

export default function PlayerList({ players, gameCounts, onEdit, onDelete, onStatusChange }: PlayerListProps) {
  const playerNumbers = usePlayerNumbers()
  const [filter, setFilter] = useState<'all' | PlayerStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [searchQuery, setSearchQuery] = useState('')

  const byStatus = filter === 'all' ? players : players.filter((p) => p.status === filter)
  const bySearch = searchQuery.trim()
    ? byStatus.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : byStatus
  const sorted = [...bySearch].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ja')
    if (sortBy === 'rank') return (RANK_ORDER[b.rank ?? ''] ?? 0) - (RANK_ORDER[a.rank ?? ''] ?? 0)
    if (sortBy === 'games') return (gameCounts.get(b.id) ?? 0) - (gameCounts.get(a.id) ?? 0)
    return a.createdAt - b.createdAt
  })

  return (
    <div>
      {/* 名前検索 */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="名前で検索…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* ソート */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {sortOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              sortBy === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ステータスフィルター */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === value
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
            <span className={`ml-1 text-sm ${filter === value ? 'opacity-80' : 'opacity-50'}`}>
              {value === 'all' ? players.length : players.filter((p) => p.status === value).length}
            </span>
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            {searchQuery.trim() ? '該当する選手が見つかりません' : '選手が登録されていません'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              gameCount={gameCounts.get(player.id) ?? 0}
              playerNumber={playerNumbers.get(player.id)}
              onEdit={() => onEdit(player)}
              onDelete={() => onDelete(player)}
              onStatusChange={(status) => onStatusChange(player.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
