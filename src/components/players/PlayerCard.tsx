import { useState } from 'react'
import type { Player, PlayerStatus } from '@/types'

interface PlayerCardProps {
  player: Player
  gameCount: number
  playerNumber?: number
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: PlayerStatus) => void
  bulkMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
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

export default function PlayerCard({ player, gameCount, playerNumber, onEdit, onDelete, onStatusChange, bulkMode, selected, onToggleSelect }: PlayerCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleStatusSelect = (status: PlayerStatus) => {
    onStatusChange(status)
    setPickerOpen(false)
  }

  return (
    <div
      onClick={bulkMode ? onToggleSelect : undefined}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity
        ${player.status === 'absent' ? 'opacity-50' : ''}
        ${bulkMode ? 'cursor-pointer active:bg-gray-50' : ''}
        ${selected ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      <div className="px-3 py-2 flex items-center gap-2.5">
        {/* チェックボックス（bulkMode時）/ ステータスドット（通常時） */}
        {bulkMode ? (
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'
          }`}>
            {selected && <span className="text-xs font-bold leading-none">✓</span>}
          </span>
        ) : (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex-shrink-0 flex items-center gap-1.5 group"
            aria-label="ステータス変更"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[player.status]}`} />
            <span className={`text-sm font-medium transition-colors ${
              player.status === 'active' ? 'text-green-600'
              : player.status === 'resting' ? 'text-amber-500'
              : 'text-gray-400'
            }`}>
              {STATUS_OPTIONS.find(o => o.value === player.status)?.label}
            </span>
          </button>
        )}

        {/* 名前・ランク・性別 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {playerNumber !== undefined && (
              <span className="text-sm bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded-md font-mono flex-shrink-0">#{playerNumber}</span>
            )}
            <span className="text-sm font-semibold text-gray-800 truncate">{player.name}</span>
            {player.rank && (
              <span className="text-sm bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-lg font-bold leading-none">
                {player.rank}
              </span>
            )}
            {player.gender === 'male' && (
              <span className="text-sm bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-lg font-bold leading-none flex-shrink-0">
                男性
              </span>
            )}
            {player.gender === 'female' && (
              <span className="text-sm bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-lg font-bold leading-none flex-shrink-0">
                女性
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 font-medium mt-0.5">{gameCount}試合</div>
        </div>

        {/* 編集・削除 */}
        {!bulkMode && (
          <div className="flex gap-0.5 flex-shrink-0">
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-sm"
              aria-label="編集"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-400 text-sm"
              aria-label="削除"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {pickerOpen && !bulkMode && (
        <div className="border-t border-gray-100 px-3 py-2 flex gap-1.5 bg-gray-50">
          {STATUS_OPTIONS.map(({ value, label, active, inactive }) => (
            <button
              key={value}
              onClick={() => handleStatusSelect(value)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
