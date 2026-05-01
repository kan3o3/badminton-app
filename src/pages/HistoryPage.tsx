import { useState } from 'react'
import useAppStore from '@/store/useAppStore'
import MatchHistoryCard from '@/components/history/MatchHistoryCard'
import RankingTable from '@/components/history/RankingTable'
import { useStats } from '@/hooks/useStats'
import { generateShareText } from '@/utils/sharing'

type View = 'history' | 'ranking'
type DateFilter = 'today' | 'all'

export default function HistoryPage() {
  const [view, setView] = useState<View>('ranking')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  const players = useAppStore((s) => s.players)
  const gameHistory = useAppStore((s) => s.gameHistory)
  const sessionDate = useAppStore((s) => s.sessionDate)

  const stats = useStats(dateFilter)

  const filteredHistory = dateFilter === 'today'
    ? gameHistory.filter((r) => r.sessionDate === sessionDate)
    : gameHistory

  const fallbackCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => alert('クリップボードにコピーしました'))
        .catch(() => alert(text))
    } else {
      alert(text)
    }
  }

  const handleShare = async () => {
    const dateLabel = dateFilter === 'today' ? '今日' : '全期間'
    const text = generateShareText(filteredHistory, players, stats, dateLabel, sessionDate)

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') fallbackCopy(text)
      }
    } else {
      fallbackCopy(text)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">結果・順位</h1>

      {/* View toggle */}
      <div className="flex bg-gray-200 rounded-xl p-1 mb-4">
        {(['ranking', 'history'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            {v === 'ranking' ? '🏆 順位' : '📋 履歴'}
          </button>
        ))}
      </div>

      {/* Date filter + Share */}
      <div className="flex gap-2 mb-4">
        {(['today', 'all'] as DateFilter[]).map((d) => (
          <button
            key={d}
            onClick={() => setDateFilter(d)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              dateFilter === d
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {d === 'today' ? '今日' : '全期間'}
          </button>
        ))}
        <button
          onClick={handleShare}
          className="ml-auto px-3 py-1.5 rounded-full text-sm font-medium bg-green-600 text-white"
        >
          共有
        </button>
      </div>

      {view === 'ranking' ? (
        <RankingTable stats={stats} players={players} />
      ) : (
        <div className="space-y-2">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">試合履歴がまだありません</p>
          ) : (
            [...filteredHistory].reverse().map((r) => (
              <MatchHistoryCard key={r.id} result={r} players={players} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
