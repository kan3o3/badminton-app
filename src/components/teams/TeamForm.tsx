import { useState, forwardRef, useImperativeHandle } from 'react'
import type { Player, TeamColor } from '@/types'

interface TeamFormProps {
  initialName?: string
  initialColor?: TeamColor
  initialPlayerIds?: string[]
  players: Player[]
  onSubmit: (name: string, color: TeamColor, playerIds: string[]) => void
}

export interface TeamFormHandle {
  save: () => void
}

const COLORS: { value: TeamColor; label: string; bg: string; ring: string }[] = [
  { value: 'red', label: '赤', bg: 'bg-red-500', ring: 'ring-red-400' },
  { value: 'blue', label: '青', bg: 'bg-blue-500', ring: 'ring-blue-400' },
  { value: 'green', label: '緑', bg: 'bg-green-500', ring: 'ring-green-400' },
  { value: 'yellow', label: '黄', bg: 'bg-yellow-400', ring: 'ring-yellow-400' },
  { value: 'purple', label: '紫', bg: 'bg-purple-500', ring: 'ring-purple-400' },
]

const TeamForm = forwardRef<TeamFormHandle, TeamFormProps>(
  function TeamForm({ initialName = '', initialColor = 'red', initialPlayerIds = [], players, onSubmit }, ref) {
    const [name, setName] = useState(initialName)
    const [color, setColor] = useState<TeamColor>(initialColor)
    const [selectedIds, setSelectedIds] = useState<string[]>(initialPlayerIds)
    const [error, setError] = useState(false)

    const handleSave = () => {
      const trimmed = name.trim()
      if (!trimmed) { setError(true); return }
      onSubmit(trimmed, color, selectedIds)
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    const togglePlayer = (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">チーム名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error && e.target.value.trim()) setError(false) }}
            placeholder="例：Aチーム"
            className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'
            }`}
            maxLength={20}
          />
          {error && <p className="mt-1 text-xs text-red-500">チーム名を入力してください</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">チームカラー</label>
          <div className="flex gap-2">
            {COLORS.map(({ value, label, bg, ring }) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
                  color === value ? `border-gray-400 ring-2 ${ring}` : 'border-transparent'
                }`}
              >
                <span className={`w-6 h-6 rounded-full ${bg}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メンバー
            <span className="ml-2 text-xs text-gray-400 font-normal">{selectedIds.length}名選択中</span>
          </label>
          {players.length === 0 ? (
            <p className="text-sm text-gray-400">選手が登録されていません</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {players.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedIds.includes(p.id) ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => togglePlayer(p.id)}
                    className="accent-green-600"
                  />
                  <span className="text-sm text-gray-800 font-medium">{p.name}</span>
                  {p.gender === 'male' && <span className="text-xs bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-lg font-bold leading-none">男</span>}
                  {p.gender === 'female' && <span className="text-xs bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-lg font-bold leading-none">女</span>}
                  {p.rank && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-lg font-bold ml-auto">
                      {p.rank}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

export default TeamForm
