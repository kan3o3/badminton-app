import { useState, useRef } from 'react'
import type { Team, TeamColor } from '@/types'
import useAppStore from '@/store/useAppStore'
import TeamCard from '@/components/teams/TeamCard'
import TeamForm, { type TeamFormHandle } from '@/components/teams/TeamForm'
import TeamMatchSetup from '@/components/teams/TeamMatchSetup'
import TeamMatchView from '@/components/teams/TeamMatchView'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Button from '@/components/common/Button'

function FormFooter({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-3">
      <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>キャンセル</Button>
      <Button type="button" className="flex-1" onClick={onSave}>保存</Button>
    </div>
  )
}

export default function TeamPage() {
  const teams = useAppStore((s) => s.teams)
  const players = useAppStore((s) => s.players)
  const courtConfig = useAppStore((s) => s.courtConfig)
  const addTeam = useAppStore((s) => s.addTeam)
  const updateTeam = useAppStore((s) => s.updateTeam)
  const deleteTeam = useAppStore((s) => s.deleteTeam)
  const activeTeamMatch = useAppStore((s) => s.activeTeamMatch)
  const startTeamMatch = useAppStore((s) => s.startTeamMatch)
  const updateTeamCourtScore = useAppStore((s) => s.updateTeamCourtScore)
  const finalizeTeamCourt = useAppStore((s) => s.finalizeTeamCourt)
  const finalizeTeamMatch = useAppStore((s) => s.finalizeTeamMatch)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Team | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)
  const [showMatch, setShowMatch] = useState(!!activeTeamMatch)

  const addFormRef = useRef<TeamFormHandle>(null)
  const editFormRef = useRef<TeamFormHandle>(null)

  const handleAdd = (name: string, color: TeamColor, playerIds: string[]) => {
    addTeam(name, color, playerIds)
    setAddOpen(false)
  }

  const handleEdit = (name: string, color: TeamColor, playerIds: string[]) => {
    if (!editTarget) return
    updateTeam(editTarget.id, { name, color, playerIds })
    setEditTarget(null)
  }

  const matchInProgress = activeTeamMatch && activeTeamMatch.status === 'active'

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 pt-1">
        <h1 className="text-xl font-bold text-gray-800">チーム管理</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>＋ 追加</Button>
      </div>

      {/* チーム一覧 */}
      <div className="space-y-2 mb-4">
        {teams.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-400 text-sm">チームが登録されていません</p>
          </div>
        ) : (
          teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              players={players}
              onEdit={() => setEditTarget(team)}
              onDelete={() => setDeleteTarget(team)}
            />
          ))
        )}
      </div>

      {/* 団体戦セクション */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-700">団体戦</h2>
          {matchInProgress && (
            <button
              onClick={() => setShowMatch((v) => !v)}
              className="text-xs text-green-600 font-semibold"
            >
              {showMatch ? '設定を表示' : '試合を表示'}
            </button>
          )}
        </div>

        {matchInProgress && showMatch ? (
          <TeamMatchView
            match={activeTeamMatch}
            teams={teams}
            players={players}
            onUpdateScore={updateTeamCourtScore}
            onFinalizeCourt={finalizeTeamCourt}
            onFinalizeMatch={() => { finalizeTeamMatch(); setShowMatch(false) }}
          />
        ) : activeTeamMatch?.status === 'completed' ? (
          <div>
            <TeamMatchView
              match={activeTeamMatch}
              teams={teams}
              players={players}
              onUpdateScore={updateTeamCourtScore}
              onFinalizeCourt={finalizeTeamCourt}
              onFinalizeMatch={finalizeTeamMatch}
            />
            <Button
              variant="secondary"
              className="w-full mt-3"
              onClick={() => startTeamMatch({ ...activeTeamMatch, status: 'active', courts: activeTeamMatch.courts.map(c => ({ ...c, scoreA: null, scoreB: null, status: 'pending' })), createdAt: Date.now() })}
            >
              もう一度
            </Button>
          </div>
        ) : (
          <TeamMatchSetup
            teams={teams}
            players={players}
            totalCourts={courtConfig.totalCourts}
            format={courtConfig.format}
            onStart={(match) => { startTeamMatch(match); setShowMatch(true) }}
          />
        )}
      </div>

      {/* モーダル */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="チームを追加"
        footer={<FormFooter onSave={() => addFormRef.current?.save()} onCancel={() => setAddOpen(false)} />}
      >
        <TeamForm
          ref={addFormRef}
          players={players}
          takenPlayerIds={new Set(teams.flatMap((t) => t.playerIds))}
          onSubmit={handleAdd}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="チームを編集"
        footer={<FormFooter onSave={() => editFormRef.current?.save()} onCancel={() => setEditTarget(null)} />}
      >
        {editTarget && (
          <TeamForm
            ref={editFormRef}
            initialName={editTarget.name}
            initialColor={editTarget.color}
            initialPlayerIds={editTarget.playerIds}
            players={players}
            takenPlayerIds={new Set(teams.filter((t) => t.id !== editTarget.id).flatMap((t) => t.playerIds))}
            onSubmit={handleEdit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`「${deleteTarget?.name}」を削除しますか？`}
        onConfirm={() => { if (deleteTarget) { deleteTeam(deleteTarget.id); setDeleteTarget(null) } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
