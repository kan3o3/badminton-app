interface TimerDisplayProps {
  seconds: number
  running: boolean
  defaultSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
  compact?: boolean
}

export default function TimerDisplay({ seconds, running, defaultSeconds, onStart, onPause, onReset, compact }: TimerDisplayProps) {
  if (defaultSeconds === 0) return null

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isDone = seconds === 0
  const isAlert = seconds <= 30 && seconds > 0 && running

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono font-bold tabular-nums ${compact ? 'text-sm' : 'text-base'} ${
          isDone ? 'text-red-300 animate-pulse' : isAlert ? 'text-yellow-300' : 'text-white/90'
        }`}
      >
        {isDone ? '終了' : timeStr}
      </span>
      <button
        onClick={running ? onPause : onStart}
        className={`text-white/80 hover:text-white flex items-center justify-center ${compact ? 'text-base w-6 h-6' : 'text-lg w-8 h-8'}`}
        aria-label={running ? '一時停止' : '開始'}
      >
        {running ? '⏸' : '▶'}
      </button>
      <button
        onClick={onReset}
        className={`text-white/60 hover:text-white/90 flex items-center justify-center ${compact ? 'text-base w-6 h-6' : 'text-lg w-8 h-8'}`}
        aria-label="リセット"
      >
        ↺
      </button>
    </div>
  )
}
