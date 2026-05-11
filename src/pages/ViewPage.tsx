import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { fetchSession, type SessionPayload } from '@/utils/sessionSync'
import CourtCard from '@/components/courts/CourtCard'

export default function ViewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [payload, setPayload] = useState<SessionPayload | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [ended, setEnded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = async () => {
    if (!sessionId) return
    const data = await fetchSession(sessionId)
    if (data) {
      setPayload(data)
      setLastUpdated(new Date())
      setElapsed(0)
    } else if (lastUpdated) {
      setEnded(true)
    }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(tick)
  }, [])

  if (ended) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-3 text-gray-500">
        <p className="text-4xl">🏸</p>
        <p className="font-bold text-lg">セッションが終了しました</p>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-3 text-gray-400">
        <p className="text-4xl animate-pulse">🏸</p>
        <p>読み込み中...</p>
      </div>
    )
  }

  const sortedMatches = [...payload.activeMatches].sort((a, b) => a.courtIndex - b.courtIndex)

  return (
    <div className="p-3 gap-2 flex flex-col min-h-svh bg-gray-100">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">試合管理</h1>
          <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">観戦モード</span>
        </div>
        <span className="text-xs text-gray-400">
          {elapsed < 60 ? `${elapsed}秒前に更新` : '更新中...'}
        </span>
      </div>

      {sortedMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-3xl">🏸</p>
          <p className="text-gray-500 text-sm font-medium">試合がまだ始まっていません</p>
        </div>
      ) : (
        sortedMatches.map((match) => (
          <CourtCard
            key={match.id}
            match={match}
            players={payload.players as any}
            swapMode={false}
            selectedId={null}
            onSelectPlayer={() => {}}
          />
        ))
      )}
    </div>
  )
}
