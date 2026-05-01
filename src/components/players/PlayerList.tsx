import { useState } from 'react'
import type { Player, PlayerStatus } from '@/types'
import PlayerCard from './PlayerCard'

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

export default function PlayerList({ players, gameCounts, onEdit, onDelete, onStatusChange }: PlayerListProps) {
  const [filter, setFilter] = useState<'all' | PlayerStatus>('all')

  const filtered = filter === 'all' ? players : players.filter((p) => p.status === filter)

  return (
    <div>
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
            <span className={`ml-1 text-xs ${filter === value ? 'opacity-80' : 'opacity-50'}`}>
              {value === 'all' ? players.length : players.filter((p) => p.status === value).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-gray-400 text-sm">選手が登録されていません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              gameCount={gameCounts.get(player.id) ?? 0}
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
