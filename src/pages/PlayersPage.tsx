import { useState, useMemo, useRef } from 'react'
import type { Player, PlayerStatus, SkillRank, Gender } from '@/types'
import useAppStore from '@/store/useAppStore'
import PlayerList from '@/components/players/PlayerList'
import PlayerForm, { type PlayerFormHandle } from '@/components/players/PlayerForm'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Button from '@/components/common/Button'
import PairSection from '@/components/players/PairSection'

function FormFooter({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-3">
      <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
        キャンセル
      </Button>
      <Button type="button" className="flex-1" onClick={onSave}>
        保存
      </Button>
    </div>
  )
}

export default function PlayersPage() {
  const players = useAppStore((s) => s.players)
  const addPlayer = useAppStore((s) => s.addPlayer)
  const updatePlayer = useAppStore((s) => s.updatePlayer)
  const deletePlayer = useAppStore((s) => s.deletePlayer)
  const setPlayerStatus = useAppStore((s) => s.setPlayerStatus)
  const initWaitingQueue = useAppStore((s) => s.initWaitingQueue)
  const gameHistory = useAppStore((s) => s.gameHistory)
  const sessionDate = useAppStore((s) => s.sessionDate)
  const pairs = useAppStore((s) => s.pairs)
  const addPair = useAppStore((s) => s.addPair)
  const deletePair = useAppStore((s) => s.deletePair)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null)

  const addFormRef = useRef<PlayerFormHandle>(null)
  const editFormRef = useRef<PlayerFormHandle>(null)

  const gameCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of gameHistory) {
      if (r.sessionDate !== sessionDate) continue
      for (const id of [...r.sideA, ...r.sideB]) {
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
    return counts
  }, [gameHistory, sessionDate])

  const handleAdd = (name: string, rank: SkillRank, gender: Gender) => {
    addPlayer(name, rank, gender)
    setAddOpen(false)
  }

  const handleEdit = (name: string, rank: SkillRank, gender: Gender) => {
    if (!editTarget) return
    updatePlayer(editTarget.id, { name, rank, gender })
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deletePlayer(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 pt-1">
        <h1 className="text-xl font-bold text-gray-800">選手管理</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          ＋ 追加
        </Button>
      </div>

      {players.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { players.forEach(p => setPlayerStatus(p.id, 'active')); initWaitingQueue() }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 active:bg-green-200"
          >
            全員参加
          </button>
          <button
            onClick={() => { players.forEach(p => setPlayerStatus(p.id, 'resting')); initWaitingQueue() }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 active:bg-amber-200"
          >
            全員休憩
          </button>
        </div>
      )}

      <PlayerList
        players={players}
        gameCounts={gameCounts}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onStatusChange={(id: string, status: PlayerStatus) => {
          setPlayerStatus(id, status)
          initWaitingQueue()
        }}
      />

      <PairSection players={players} pairs={pairs} addPair={addPair} deletePair={deletePair} />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="選手を追加"
        footer={
          <FormFooter
            onSave={() => addFormRef.current?.save()}
            onCancel={() => setAddOpen(false)}
          />
        }
      >
        <PlayerForm ref={addFormRef} onSubmit={handleAdd} />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="選手を編集"
        footer={
          <FormFooter
            onSave={() => editFormRef.current?.save()}
            onCancel={() => setEditTarget(null)}
          />
        }
      >
        {editTarget && (
          <PlayerForm
            ref={editFormRef}
            initialName={editTarget.name}
            initialRank={editTarget.rank}
            initialGender={editTarget.gender ?? null}
            onSubmit={handleEdit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`「${deleteTarget?.name}」を削除しますか？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
