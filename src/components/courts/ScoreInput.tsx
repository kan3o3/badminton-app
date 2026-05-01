import { useState } from 'react'
import Button from '@/components/common/Button'

interface ScoreInputProps {
  courtIndex: number
  scoreA: number | null
  scoreB: number | null
  onSave: (scoreA: number | null, scoreB: number | null) => void
}

export default function ScoreInput({ scoreA, scoreB, onSave }: ScoreInputProps) {
  const [a, setA] = useState(scoreA !== null ? String(scoreA) : '')
  const [b, setB] = useState(scoreB !== null ? String(scoreB) : '')

  const handleSave = () => {
    const pa = a === '' ? null : parseInt(a, 10)
    const pb = b === '' ? null : parseInt(b, 10)
    onSave(pa, pb)
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="number"
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="0"
        min={0}
        max={99}
        className="w-14 text-center border border-gray-300 rounded-lg py-1 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <span className="text-gray-500 font-bold">−</span>
      <input
        type="number"
        value={b}
        onChange={(e) => setB(e.target.value)}
        placeholder="0"
        min={0}
        max={99}
        className="w-14 text-center border border-gray-300 rounded-lg py-1 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <Button size="sm" variant="secondary" onClick={handleSave}>
        保存
      </Button>
    </div>
  )
}
