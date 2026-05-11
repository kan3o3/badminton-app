import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import useAppStore from '@/store/useAppStore'
import { generateId } from './id'
import type { ActiveMatch, Player, CourtConfig } from '@/types'

export interface SessionPayload {
  activeMatches: ActiveMatch[]
  players: Pick<Player, 'id' | 'name' | 'gender' | 'rank'>[]
  courtConfig: Pick<CourtConfig, 'format' | 'totalCourts' | 'courtFormats'>
}

export async function upsertSession(id: string, payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('sessions').upsert({
    id,
    updated_at: new Date().toISOString(),
    expires_at: expiresAt,
    payload,
  })
}

export async function fetchSession(id: string): Promise<SessionPayload | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('payload')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data.payload as SessionPayload
}

export async function deleteSession(id: string): Promise<void> {
  await supabase.from('sessions').delete().eq('id', id)
}

export function useSessionSync() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const activeMatches = useAppStore((s) => s.activeMatches)
  const players = useAppStore((s) => s.players)
  const courtConfig = useAppStore((s) => s.courtConfig)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isSharing || !sessionId || syncingRef.current) return
    syncingRef.current = true
    const payload: SessionPayload = {
      activeMatches,
      players: players.map(({ id, name, gender, rank }) => ({ id, name, gender, rank })),
      courtConfig: {
        format: courtConfig.format,
        totalCourts: courtConfig.totalCourts,
        courtFormats: courtConfig.courtFormats,
      },
    }
    upsertSession(sessionId, payload).finally(() => {
      syncingRef.current = false
    })
  }, [isSharing, sessionId, activeMatches, players, courtConfig])

  const startSession = async (): Promise<string> => {
    const id = generateId()
    setSessionId(id)
    setIsSharing(true)
    return id
  }

  const stopSession = async () => {
    if (sessionId) await deleteSession(sessionId)
    setSessionId(null)
    setIsSharing(false)
  }

  return { sessionId, isSharing, startSession, stopSession }
}
