import { useMemo } from 'react'
import useAppStore from '@/store/useAppStore'

export function usePlayerNumbers(): Map<string, number> {
  const players = useAppStore((s) => s.players)
  return useMemo(() => {
    const sorted = [...players]
      .filter((p) => p.status !== 'absent')
      .sort((a, b) => a.createdAt - b.createdAt)
    const map = new Map<string, number>()
    sorted.forEach((p, i) => map.set(p.id, i + 1))
    return map
  }, [players])
}
