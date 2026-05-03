import { useState } from 'react'
import type { Player, PlayerStatus } from '@/types'

interface PlayerCardProps {
  player: Player
  gameCount: number
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: PlayerStatus) => void
}

const STATUS_OPTIONS: { value: PlayerStatus; label: string; active: string; inactive: string }[] = [
  {
    value: 'active',
    label: '参加中',
    active: 'bg-green-500 text-white shadow-sm',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600',
  },
  {
    value: 'resting',
    label: '休憩中',
    active: 'bg-amber-400 text-white shadow-sm',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600',
  },
  {
    value: 'absent',
    label: '不参加',
    active: 'bg-gray-400 text-white shadow-sm',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
]

const STATUS_DOT: Record<PlayerStatus, string> = {
  active: 'bg-green-500',
  resting: 'bg-amber-400',
  absent: 'bg-gray-300',
}

export default function PlayerCard({ player, gameCount, onEdit, onDelete, onStatusChange }: PlayerCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleStatusSelect = (status: PlayerStatus) => {
    onStatusChange(status)
    setPickerOpen(false)
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity ${player.status === 'absent' ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* ステータスドット + バッジ */}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="flex-shrink-0 flex items-center gap-1.5 group"
          aria-label="ステータス変更"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[player.status]}`} />
          <span className={`text-xs font-medium transition-colors ${
            player.status === 'active' ? 'text-green-600'
            : player.status === 'resting' ? 'text-amber-500'
            : 'text-gray-400'
          }`}>
            {STATUS_OPTIONS.find(o => o.value === player.status)?.label}
          </span>
        </button>

        {/* 名前・ランク・性別 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate">{player.name}</span>
            {player.gender === 'male' && (
              <span className="text-xs text-blue-500 font-bold leading-none">♂</span>
            )}
            {player.gender === 'female' && (
              <span className="text-xs text-pink-500 font-bold leading-none">♀</span>
            )}
            {player.rank && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-lg font-bold leading-none">
                {player.rank}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{gameCount}試合</div>
        </div>

        {/* 編集・削除 */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-base"
            aria-label="編集"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-400 text-base"
            aria-label="削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="border-t border-gray-100 px-4 py-2.5 flex gap-2 bg-gray-50">
          {STATUS_OPTIONS.map(({ value, label, active, inactive }) => (
            <button
              key={value}
              onClick={() => handleStatusSelect(value)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                player.status === value ? active : inactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
