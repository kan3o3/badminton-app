import { useState, useEffect, useRef } from 'react'
import type { ActiveMatch, Player } from '@/types'
import TimerDisplay from './TimerDisplay'
import useAppStore from '@/store/useAppStore'
import { usePlayerNumbers } from '@/hooks/usePlayerNumbers'

interface CourtCardProps {
  match: ActiveMatch
  players: Player[]
  swapMode: boolean
  selectedId: string | null
  onSelectPlayer: (id: string) => void
  compact?: boolean
}

interface PlayerNameProps {
  playerId: string
  players: Player[]
  playerNumbers: Map<string, number>
  swapMode: boolean
  selected: boolean
  isTarget: boolean
  onClick: () => void
  compact?: boolean
}

function playTimerAlert() {
  try {
    const ctx = new AudioContext()
    const times = [0, 0.35, 0.7]
    times.forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.3)
    })
  } catch {
    // 音声非対応環境では無視
  }
  if ('vibrate' in navigator) {
    navigator.vibrate([300, 150, 300, 150, 300])
  }
}

function PlayerName({ playerId, players, playerNumbers, swapMode, selected, isTarget, onClick, compact }: PlayerNameProps) {
  const player = players.find((p) => p.id === playerId)
  if (!player) return <span className="text-gray-300 text-xs px-2 py-1">-</span>

  const num = playerNumbers.get(playerId)

  return (
    <button
      onClick={swapMode ? onClick : undefined}
      disabled={!swapMode}
      className={`inline-flex items-center gap-1.5 rounded-xl transition-all font-semibold ${
        compact ? 'px-2.5 py-1 text-sm' : 'px-3 py-2 text-base'
      } ${
        swapMode
          ? selected
            ? 'bg-yellow-300 ring-2 ring-yellow-500 shadow-sm'
            : isTarget
            ? 'bg-green-100 ring-2 ring-green-400 cursor-pointer shadow-sm'
            : 'hover:bg-gray-100 cursor-pointer active:bg-gray-200'
          : 'cursor-default'
      }`}
    >
      {player.gender === 'male' && <span className={`rounded-full bg-sky-400 flex-shrink-0 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />}
      {player.gender === 'female' && <span className={`rounded-full bg-rose-400 flex-shrink-0 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />}
      {num !== undefined && (
        <span className={`bg-gray-100 text-gray-600 font-bold rounded font-mono ${compact ? 'text-xs px-1 py-0.5' : 'text-sm px-1.5 py-0.5'}`}>#{num}</span>
      )}
      <span className="text-gray-800">{player.name}</span>
      {player.rank && (
        <span className={`bg-blue-100 text-blue-600 font-bold rounded leading-none ${compact ? 'text-xs px-1 py-0.5' : 'text-sm px-1.5 py-0.5'}`}>{player.rank}</span>
      )}
    </button>
  )
}

export default function CourtCard({ match, players, swapMode: rawSwapMode, selectedId, onSelectPlayer, compact }: CourtCardProps) {
  const swapMode = rawSwapMode && !match.finished
  const playerNumbers = usePlayerNumbers()
  const [showScore, setShowScore] = useState(false)
  const [scoreA, setScoreA] = useState(match.scoreA !== null ? String(match.scoreA) : '')
  const [scoreB, setScoreB] = useState(match.scoreB !== null ? String(match.scoreB) : '')

  useEffect(() => {
    setScoreA(match.scoreA !== null ? String(match.scoreA) : '')
    setScoreB(match.scoreB !== null ? String(match.scoreB) : '')
  }, [match.scoreA, match.scoreB])

  const prevRunningRef = useRef(match.timerRunning)
  useEffect(() => {
    if (prevRunningRef.current && !match.timerRunning && match.timerSeconds === 0) {
      playTimerAlert()
    }
    prevRunningRef.current = match.timerRunning
  }, [match.timerRunning, match.timerSeconds])

  const finalizeMatch = useAppStore((s) => s.finalizeMatch)
  const setScore = useAppStore((s) => s.setScore)
  const startTimer = useAppStore((s) => s.startTimer)
  const pauseTimer = useAppStore((s) => s.pauseTimer)
  const resetTimer = useAppStore((s) => s.resetTimer)
  const courtConfig = useAppStore((s) => s.courtConfig)
  const setCourtFormat = useAppStore((s) => s.setCourtFormat)
  const timerDefaultSeconds = courtConfig.timerDefaultSeconds
  const courtFormat = courtConfig.courtFormats[match.courtIndex] ?? courtConfig.format
  const toggleFormat = () =>
    setCourtFormat(match.courtIndex, courtFormat === 'doubles' ? 'singles' : 'doubles')

  const handleScoreSave = () => {
    const a = scoreA === '' ? null : parseInt(scoreA, 10)
    const b = scoreB === '' ? null : parseInt(scoreB, 10)
    setScore(match.courtIndex, a, b)
    setShowScore(false)
  }

  const scoreLabel =
    match.scoreA !== null && match.scoreB !== null
      ? `${match.scoreA} − ${match.scoreB}`
      : null

  const headerBg = match.finished ? 'bg-gray-300' : 'bg-green-600'
  const formatLabel = courtFormat === 'doubles' ? 'ダブルス' : 'シングルス'

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${swapMode ? 'ring-2 ring-blue-400' : ''} ${match.finished ? 'opacity-70' : ''}`}>

      {/* ── ヘッダー ── */}
      <div className={`${headerBg} flex items-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-white font-bold ${compact ? 'text-sm' : 'text-base'}`}>コート {match.courtIndex + 1}</span>
          <button
            onClick={toggleFormat}
            title="形式を切り替え"
            className={`text-white/80 border border-white/30 rounded-md hover:bg-white/15 active:bg-white/25 leading-tight ${compact ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'}`}
          >
            {formatLabel}
          </button>
        </div>

        {match.finished ? (
          <>
            <span className={`text-white/70 ml-1 ${compact ? 'text-sm' : 'text-base'}`}>終了</span>
            {scoreLabel && (
              <span className={`ml-auto bg-white/20 text-white font-bold rounded-lg ${compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}`}>{scoreLabel}</span>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 flex justify-center">
              <TimerDisplay
                seconds={match.timerSeconds}
                running={match.timerRunning}
                defaultSeconds={timerDefaultSeconds}
                onStart={() => startTimer(match.courtIndex)}
                onPause={() => pauseTimer(match.courtIndex)}
                onReset={() => resetTimer(match.courtIndex)}
                compact={compact}
              />
            </div>
            {!swapMode && (
              <button
                onClick={() => finalizeMatch(match.courtIndex)}
                className={`shrink-0 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold rounded-xl ${compact ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
              >
                終了
              </button>
            )}
          </>
        )}
      </div>

      {/* ── チーム行 ── */}
      <div className={`flex items-center ${compact ? 'px-3 py-2 gap-2' : 'px-4 py-3 gap-3'}`}>
        <div className={`flex-1 flex flex-col items-start ${compact ? 'gap-1' : 'gap-2'}`}>
          {match.sideA.playerIds.map((id) => (
            <PlayerName
              key={id}
              playerId={id}
              players={players}
              playerNumbers={playerNumbers}
              swapMode={swapMode}
              selected={selectedId === id}
              isTarget={swapMode && selectedId !== null && selectedId !== id}
              onClick={() => onSelectPlayer(id)}
              compact={compact}
            />
          ))}
        </div>
        <span className={`shrink-0 font-bold text-gray-400 tracking-widest ${compact ? 'text-sm' : 'text-base'}`}>VS</span>
        <div className={`flex-1 flex flex-col items-end ${compact ? 'gap-1' : 'gap-2'}`}>
          {match.sideB.playerIds.map((id) => (
            <PlayerName
              key={id}
              playerId={id}
              players={players}
              playerNumbers={playerNumbers}
              swapMode={swapMode}
              selected={selectedId === id}
              isTarget={swapMode && selectedId !== null && selectedId !== id}
              onClick={() => onSelectPlayer(id)}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* ── スコア行 ── */}
      {!swapMode && !match.finished && (
        <div className={compact ? 'px-3 pb-3' : 'px-4 pb-4'}>
          {showScore ? (
            <div className="flex items-center gap-2">
              <input
                type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)}
                placeholder="0" min={0} max={99}
                className={`text-center border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 ${compact ? 'w-12 py-1.5 text-sm' : 'w-16 py-2.5 text-base'}`}
              />
              <span className={`text-gray-300 font-bold ${compact ? 'text-sm' : 'text-base'}`}>−</span>
              <input
                type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)}
                placeholder="0" min={0} max={99}
                className={`text-center border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 ${compact ? 'w-12 py-1.5 text-sm' : 'w-16 py-2.5 text-base'}`}
              />
              <button
                onClick={handleScoreSave}
                className={`bg-green-600 text-white rounded-xl font-medium ${compact ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'}`}
              >
                保存
              </button>
              <button
                onClick={() => setShowScore(false)}
                className={`text-gray-400 hover:text-gray-600 ${compact ? 'text-sm px-1' : 'text-base px-2'}`}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowScore(true)}
              className={`text-gray-400 hover:text-gray-600 active:text-gray-800 flex items-center gap-1 ${compact ? 'text-sm' : 'text-base'}`}
            >
              {scoreLabel
                ? <><span className="text-green-500">●</span> {scoreLabel}</>
                : <><span>＋</span> スコア入力</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
