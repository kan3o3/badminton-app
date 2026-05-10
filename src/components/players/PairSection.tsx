import { useState } from 'react'
import type { Player, FixedPair } from '@/types'

interface PairSectionProps {
  players: Player[]
  pairs: FixedPair[]
  addPair: (playerIds: [string, string]) => void
  deletePair: (id: string) => void
}

export default function PairSection({ players, pairs, addPair, deletePair }: PairSectionProps) {
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const activePlayers = players.filter((p) => p.status !== 'absent')

  const isDuplicatePair = (a: string, b: string) =>
    pairs.some((p) => p.playerIds.includes(a) && p.playerIds.includes(b))

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
    } else if (selected.length < 2) {
      const next = [...selected, id]
      if (next.length === 2) {
        if (!isDuplicatePair(next[0], next[1])) {
          addPair([next[0], next[1]])
        }
        setSelected([])
        setSelecting(false)
      } else {
        setSelected(next)
      }
    }
  }

  const cancelSelecting = () => {
    setSelecting(false)
    setSelected([])
  }

  const getPlayer = (id: string) => players.find((p) => p.id === id)

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">固定ペア</h2>
        {!selecting && (
          <button
            onClick={() => setSelecting(true)}
            className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1"
          >
            ＋ 追加
          </button>
        )}
      </div>

      {pairs.length === 0 && !selecting && (
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm text-center">
          <p className="text-sm text-gray-400">固定ペアはまだ登録されていません</p>
        </div>
      )}

      <div className="space-y-2">
        {pairs.map((pair) => {
          const [id1, id2] = pair.playerIds
          const p1 = getPlayer(id1)
          const p2 = getPlayer(id2)
          return (
            <div key={pair.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{p1?.name ?? '?'}</span>
                {p1?.rank && (
                  <span className="text-xs bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-lg">{p1.rank}</span>
                )}
                <span className="text-gray-300 text-sm font-bold">＆</span>
                <span className="text-sm font-semibold text-gray-800">{p2?.name ?? '?'}</span>
                {p2?.rank && (
                  <span className="text-xs bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-lg">{p2.rank}</span>
                )}
              </div>
              <button
                onClick={() => deletePair(pair.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                aria-label="削除"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {selecting && (
        <div className="mt-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-700">
                {selected.length === 0 ? '1人目を選択' : `${players.find(p => p.id === selected[0])?.name} ＋ 2人目を選択`}
              </span>
              {selected.length === 0 && (
                <span className="text-xs text-green-500 bg-green-100 px-1.5 py-0.5 rounded-full">1 / 2</span>
              )}
              {selected.length === 1 && (
                <span className="text-xs text-green-500 bg-green-100 px-1.5 py-0.5 rounded-full">2 / 2</span>
              )}
            </div>
            <button onClick={cancelSelecting} className="text-sm text-gray-400 hover:text-gray-600 font-medium">キャンセル</button>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {activePlayers
              .filter((p) => !selected.includes(p.id) || selected[0] === p.id)
              .map((p) => {
                const isSelected = selected.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => handleToggle(p.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.rank && (
                      <span className={`text-xs font-bold px-1 py-0.5 rounded leading-none ${isSelected ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {p.rank}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
