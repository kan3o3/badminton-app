import type { Team, Player } from '@/types'

const COLOR_BG: Record<string, string> = {
  red: 'bg-red-100 border-red-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  yellow: 'bg-yellow-100 border-yellow-300',
  purple: 'bg-purple-100 border-purple-300',
}

const COLOR_TEXT: Record<string, string> = {
  red: 'text-red-700',
  blue: 'text-blue-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
  purple: 'text-purple-700',
}

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
}

interface TeamCardProps {
  team: Team
  players: Player[]
  onEdit: () => void
  onDelete: () => void
}

export default function TeamCard({ team, players, onEdit, onDelete }: TeamCardProps) {
  const members = team.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${COLOR_BG[team.color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${COLOR_DOT[team.color]}`} />
          <span className={`font-bold text-base ${COLOR_TEXT[team.color]}`}>{team.name}</span>
          <span className="text-xs text-gray-500">{members.length}名</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-white hover:text-gray-600 text-base"
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
      <div className="flex flex-wrap gap-1.5">
        {members.map((p) => (
          <span key={p.id} className="text-xs bg-white rounded-lg px-2 py-1 text-gray-700 font-medium shadow-sm">
            {p.name}
            {p.rank && <span className="ml-1 text-blue-500 font-bold">{p.rank}</span>}
          </span>
        ))}
        {members.length === 0 && (
          <span className="text-xs text-gray-400">メンバー未登録</span>
        )}
      </div>
    </div>
  )
}
