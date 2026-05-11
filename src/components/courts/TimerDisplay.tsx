interface TimerDisplayProps {
  seconds: number
  running: boolean
  defaultSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export default function TimerDisplay({ seconds, running, defaultSeconds, onStart, onPause, onReset }: TimerDisplayProps) {
  if (defaultSeconds === 0) return null

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isDone = seconds === 0
  const isAlert = seconds <= 30 && seconds > 0 && running

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono font-bold text-base tabular-nums ${
          isDone ? 'text-red-300 animate-pulse' : isAlert ? 'text-yellow-300' : 'text-white/90'
        }`}
      >
        {isDone ? '終了' : timeStr}
      </span>
      <button
        onClick={running ? onPause : onStart}
        className="text-white/80 hover:text-white text-lg w-8 h-8 flex items-center justify-center"
        aria-label={running ? '一時停止' : '開始'}
      >
        {running ? '⏸' : '▶'}
      </button>
      <button
        onClick={onReset}
        className="text-white/60 hover:text-white/90 text-lg w-8 h-8 flex items-center justify-center"
        aria-label="リセット"
      >
        ↺
      </button>
    </div>
  )
}
