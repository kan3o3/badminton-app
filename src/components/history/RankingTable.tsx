import { useState } from 'react'
import type { PlayerStats, Player } from '@/types'

interface RankingTableProps {
  stats: PlayerStats[]
  players: Player[]
}

type SortKey = 'gamesPlayed' | 'wins' | 'winRate' | 'pointDiff'

const columns: { key: SortKey; label: string }[] = [
  { key: 'gamesPlayed', label: '試合' },
  { key: 'wins', label: '勝' },
  { key: 'winRate', label: '勝率' },
  { key: 'pointDiff', label: '得失点' },
]

export default function RankingTable({ stats, players }: RankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('wins')

  const sorted = [...stats].sort((a, b) => b[sortKey] - a[sortKey])

  if (sorted.length === 0) {
    return <p className="text-center text-gray-400 py-8 text-sm">試合結果がまだありません</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-2 py-2 text-gray-600 font-medium w-6">#</th>
              <th className="text-left px-2 py-2 text-gray-600 font-medium">選手</th>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className={`px-2 py-2 text-right cursor-pointer font-medium transition-colors ${
                    sortKey === key ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setSortKey(key)}
                >
                  {label}
                  {sortKey === key && <span className="ml-0.5">↓</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((s, idx) => {
              const player = players.find((p) => p.id === s.playerId)
              return (
                <tr key={s.playerId} className={idx === 0 ? 'bg-yellow-50/50' : ''}>
                  <td className="px-2 py-2 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <span className="font-medium text-gray-800">{player?.name ?? '不明'}</span>
                    {player?.rank && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">{player.rank}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">{s.gamesPlayed}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{s.wins}</td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {s.wins + s.losses > 0 ? `${Math.round(s.winRate * 100)}%` : '−'}
                  </td>
                  <td className={`px-2 py-2 text-right font-medium ${s.pointDiff > 0 ? 'text-green-600' : s.pointDiff < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {s.pointDiff > 0 ? '+' : ''}{s.pointDiff || '−'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
