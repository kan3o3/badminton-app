import { useState, forwardRef, useImperativeHandle } from 'react'
import type { SkillRank } from '@/types'

interface PlayerFormProps {
  initialName?: string
  initialRank?: SkillRank
  onSubmit: (name: string, rank: SkillRank) => void
}

export interface PlayerFormHandle {
  save: () => void
}

const ranks: { value: SkillRank; label: string }[] = [
  { value: null, label: '未設定' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
]

const PlayerForm = forwardRef<PlayerFormHandle, PlayerFormProps>(
  function PlayerForm({ initialName = '', initialRank = null, onSubmit }, ref) {
    const [name, setName] = useState(initialName)
    const [rank, setRank] = useState<SkillRank>(initialRank)
    const [error, setError] = useState(false)

    const handleSave = () => {
      const trimmed = name.trim()
      if (!trimmed) {
        setError(true)
        return
      }
      onSubmit(trimmed, rank)
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    const handleNameChange = (v: string) => {
      setName(v)
      if (error && v.trim()) setError(false)
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            placeholder="例：田中"
            enterKeyHint="done"
            className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'
            }`}
            maxLength={20}
          />
          {error && <p className="mt-1 text-xs text-red-500">名前を入力してください</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">レベル（任意）</label>
          <div className="flex gap-2">
            {ranks.map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setRank(value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  rank === value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

export default PlayerForm
