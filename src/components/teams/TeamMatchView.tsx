import type { TeamMatch, Team, Player } from '@/types'
import Button from '@/components/common/Button'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useState } from 'react'

const COLOR_BG: Record<string, string> = {
  red: 'bg-red-50 border-red-200', blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200', yellow: 'bg-yellow-50 border-yellow-200',
  purple: 'bg-purple-50 border-purple-200',
}
const COLOR_TEXT: Record<string, string> = {
  red: 'text-red-600', blue: 'text-blue-600', green: 'text-green-600',
  yellow: 'text-yellow-600', purple: 'text-purple-600',
}
const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
  yellow: 'bg-yellow-500', purple: 'bg-purple-500',
}

interface Props {
  match: TeamMatch
  teams: Team[]
  players: Player[]
  onUpdateScore: (courtIndex: number, scoreA: number | null, scoreB: number | null) => void
  onFinalizeCourt: (courtIndex: number) => void
  onFinalizeMatch: () => void
}

function ScoreInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value === '' ? null : Number(e.target.value)
        onChange(v)
      }}
      placeholder="—"
      className="w-14 text-center border border-gray-300 rounded-xl px-2 py-1.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  )
}

export default function TeamMatchView({ match, teams, players, onUpdateScore, onFinalizeCourt, onFinalizeMatch }: Props) {
  const [finalizeOpen, setFinalizeOpen] = useState(false)

  const teamA = teams.find((t) => t.id === match.teamAId)
  const teamB = teams.find((t) => t.id === match.teamBId)

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? '?'

  const winsA = match.courts.filter((c) => c.status === 'done' && c.scoreA !== null && c.scoreB !== null && c.scoreA > c.scoreB).length
  const winsB = match.courts.filter((c) => c.status === 'done' && c.scoreA !== null && c.scoreB !== null && c.scoreB > c.scoreA).length
  const draws = match.courts.filter((c) => c.status === 'done' && c.scoreA !== null && c.scoreB !== null && c.scoreA === c.scoreB).length

  const isCompleted = match.status === 'completed'

  return (
    <div className="space-y-4">
      {/* スコアボード */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-around">
          {teamA && (
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <span className={`w-3 h-3 rounded-full ${COLOR_DOT[teamA.color]}`} />
                <span className={`font-bold text-sm ${COLOR_TEXT[teamA.color]}`}>{teamA.name}</span>
              </div>
              <span className="text-4xl font-black text-gray-800">{winsA}</span>
            </div>
          )}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">勝利数</div>
            <span className="text-lg font-bold text-gray-400">vs</span>
            {draws > 0 && <div className="text-xs text-gray-400 mt-1">引分 {draws}</div>}
          </div>
          {teamB && (
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <span className={`w-3 h-3 rounded-full ${COLOR_DOT[teamB.color]}`} />
                <span className={`font-bold text-sm ${COLOR_TEXT[teamB.color]}`}>{teamB.name}</span>
              </div>
              <span className="text-4xl font-black text-gray-800">{winsB}</span>
            </div>
          )}
        </div>
      </div>

      {/* 各コート */}
      {match.courts.map((court) => (
        <div key={court.courtIndex} className={`rounded-2xl border p-4 shadow-sm ${court.status === 'done' ? 'opacity-70' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">コート {court.courtIndex + 1}</span>
            {court.status === 'done' && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">確定済</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* チームA */}
            <div className={`flex-1 rounded-xl border p-2.5 text-center ${teamA ? COLOR_BG[teamA.color] : ''}`}>
              <div className={`text-xs font-bold mb-1 ${teamA ? COLOR_TEXT[teamA.color] : ''}`}>{teamA?.name}</div>
              <div className="text-xs text-gray-600">
                {court.teamAPlayerIds.map(playerName).join('・') || '—'}
              </div>
            </div>

            {/* スコア */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ScoreInput
                value={court.scoreA}
                onChange={(v) => onUpdateScore(court.courtIndex, v, court.scoreB)}
              />
              <span className="text-gray-400 font-bold">-</span>
              <ScoreInput
                value={court.scoreB}
                onChange={(v) => onUpdateScore(court.courtIndex, court.scoreA, v)}
              />
            </div>

            {/* チームB */}
            <div className={`flex-1 rounded-xl border p-2.5 text-center ${teamB ? COLOR_BG[teamB.color] : ''}`}>
              <div className={`text-xs font-bold mb-1 ${teamB ? COLOR_TEXT[teamB.color] : ''}`}>{teamB?.name}</div>
              <div className="text-xs text-gray-600">
                {court.teamBPlayerIds.map(playerName).join('・') || '—'}
              </div>
            </div>
          </div>

          {court.status === 'pending' && !isCompleted && (
            <button
              onClick={() => onFinalizeCourt(court.courtIndex)}
              disabled={court.scoreA === null || court.scoreB === null}
              className="mt-3 w-full py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              この試合を確定
            </button>
          )}
        </div>
      ))}

      {!isCompleted && (
        <Button variant="danger" className="w-full" onClick={() => setFinalizeOpen(true)}>
          団体戦を終了
        </Button>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-bold">
            {winsA > winsB ? `${teamA?.name} の勝利！` : winsB > winsA ? `${teamB?.name} の勝利！` : '引き分け'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{teamA?.name} {winsA} 勝 - {winsB} 勝 {teamB?.name}</p>
        </div>
      )}

      <ConfirmDialog
        open={finalizeOpen}
        message="団体戦を終了しますか？確定していないコートの結果も記録されます。"
        confirmLabel="終了"
        onConfirm={() => { onFinalizeMatch(); setFinalizeOpen(false) }}
        onCancel={() => setFinalizeOpen(false)}
      />
    </div>
  )
}
