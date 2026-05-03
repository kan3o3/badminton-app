import { useState } from 'react'
import type { Team, Player, MatchFormat } from '@/types'
import { generateTeamCourtAssignments, buildTeamMatch } from '@/utils/teamMatchGeneration'
import Button from '@/components/common/Button'

const COLOR_TEXT: Record<string, string> = {
  red: 'text-red-600', blue: 'text-blue-600', green: 'text-green-600',
  yellow: 'text-yellow-600', purple: 'text-purple-600',
}
const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
  yellow: 'bg-yellow-500', purple: 'bg-purple-500',
}

interface Props {
  teams: Team[]
  players: Player[]
  totalCourts: number
  format: MatchFormat
  onStart: (match: ReturnType<typeof buildTeamMatch>) => void
}

export default function TeamMatchSetup({ teams, players, totalCourts, format, onStart }: Props) {
  const [teamAId, setTeamAId] = useState(teams[0]?.id ?? '')
  const [teamBId, setTeamBId] = useState(teams[1]?.id ?? '')

  const teamA = teams.find((t) => t.id === teamAId)
  const teamB = teams.find((t) => t.id === teamBId)

  const previewCourts = teamA && teamB
    ? generateTeamCourtAssignments(teamA, teamB, players, totalCourts, format)
    : []

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? '?'

  const handleStart = () => {
    if (!teamA || !teamB || teamAId === teamBId) return
    const courts = generateTeamCourtAssignments(teamA, teamB, players, totalCourts, format)
    onStart(buildTeamMatch(teamAId, teamBId, courts))
  }

  if (teams.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">チームを2つ以上登録してから団体戦を開始できます</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
      <p className="font-semibold text-gray-700">団体戦の設定</p>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">チームA</label>
          <select
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <span className="text-gray-400 font-bold text-lg mt-4">vs</span>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">チームB</label>
          <select
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {teamAId === teamBId && (
        <p className="text-xs text-red-500">チームAとチームBに同じチームは選択できません</p>
      )}

      {/* コート割り当てプレビュー */}
      {previewCourts.length > 0 && teamAId !== teamBId && (
        <div>
          <p className="text-xs text-gray-500 mb-2">コート割り当てプレビュー</p>
          <div className="space-y-2">
            {previewCourts.map((court) => (
              <div key={court.courtIndex} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400 w-14 flex-shrink-0">コート{court.courtIndex + 1}</span>
                <span className={`font-medium ${teamA ? COLOR_TEXT[teamA.color] : ''}`}>
                  {court.teamAPlayerIds.map(playerName).join('・') || '—'}
                </span>
                <span className="text-gray-400">vs</span>
                <span className={`font-medium ${teamB ? COLOR_TEXT[teamB.color] : ''}`}>
                  {court.teamBPlayerIds.map(playerName).join('・') || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {teamA && (
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT[teamA.color]}`} />
            <span className={COLOR_TEXT[teamA.color]}>{teamA.name}</span>
          </span>
        )}
        <span className="text-gray-400 text-sm">vs</span>
        {teamB && (
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT[teamB.color]}`} />
            <span className={COLOR_TEXT[teamB.color]}>{teamB.name}</span>
          </span>
        )}
        <Button
          className="ml-auto"
          onClick={handleStart}
          disabled={!teamA || !teamB || teamAId === teamBId}
        >
          試合開始
        </Button>
      </div>
    </div>
  )
}
