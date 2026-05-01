import { useEffect, useRef } from 'react'
import useAppStore from '@/store/useAppStore'

export function useTimer() {
  const activeMatches = useAppStore((s) => s.activeMatches)
  const tickTimer = useAppStore((s) => s.tickTimer)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    const hasRunning = activeMatches.some((m) => m.timerRunning)
    if (!hasRunning) {
      cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
      return
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now
      const delta = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      for (const m of activeMatches) {
        if (m.timerRunning && m.timerSeconds > 0) {
          tickTimer(m.courtIndex, delta)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [activeMatches, tickTimer])
}
