import { useState, forwardRef, useImperativeHandle } from 'react'
import type { SkillRank, Gender } from '@/types'

interface PlayerFormProps {
  initialName?: string
  initialRank?: SkillRank
  initialGender?: Gender
  onSubmit: (name: string, rank: SkillRank, gender: Gender) => void
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

const genders: { value: Gender; label: string }[] = [
  { value: null, label: '未設定' },
  { value: 'male', label: '♂ 男性' },
  { value: 'female', label: '♀ 女性' },
]

const PlayerForm = forwardRef<PlayerFormHandle, PlayerFormProps>(
  function PlayerForm({ initialName = '', initialRank = null, initialGender = null, onSubmit }, ref) {
    const [name, setName] = useState(initialName)
    const [rank, setRank] = useState<SkillRank>(initialRank)
    const [gender, setGender] = useState<Gender>(initialGender)
    const [error, setError] = useState(false)

    const handleSave = () => {
      const trimmed = name.trim()
      if (!trimmed) {
        setError(true)
        return
      }
      onSubmit(trimmed, rank, gender)
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
          <label className="block text-sm font-medium text-gray-700 mb-2">性別（任意）</label>
          <div className="flex gap-2">
            {genders.map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setGender(value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  gender === value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
