import { useState, useMemo, useRef, useCallback } from 'react'
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
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = () => {
    if (selectedIds.size === players.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(players.map(p => p.id)))
  }

  const applyStatus = (status: PlayerStatus) => {
    selectedIds.forEach(id => setPlayerStatus(id, status))
    initWaitingQueue()
    setSelectedIds(new Set())
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedIds(new Set())
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2 pt-1">
        <h1 className="text-lg font-bold text-gray-800">選手管理</h1>
        <div className="flex gap-2">
          {players.length > 0 && (
            bulkMode ? (
              <Button size="sm" variant="secondary" onClick={exitBulkMode}>
                ✕ 完了
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setBulkMode(true)}>
                一括編集
              </Button>
            )
          )}
          {!bulkMode && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              ＋ 追加
            </Button>
          )}
        </div>
      </div>

      {bulkMode && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3">
          <span className="text-sm text-blue-700 font-medium flex-1">
            {selectedIds.size}人選択
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 font-semibold px-2 py-1 rounded-lg hover:bg-blue-100 active:bg-blue-200"
          >
            {selectedIds.size === players.length ? '全解除' : '全選択'}
          </button>
          <button
            onClick={() => applyStatus('active')}
            disabled={selectedIds.size === 0}
            className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 active:bg-green-700 disabled:opacity-40"
          >
            参加
          </button>
          <button
            onClick={() => applyStatus('resting')}
            disabled={selectedIds.size === 0}
            className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-amber-400 text-white hover:bg-amber-500 active:bg-amber-600 disabled:opacity-40"
          >
            休憩
          </button>
          <button
            onClick={() => applyStatus('absent')}
            disabled={selectedIds.size === 0}
            className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-gray-400 text-white hover:bg-gray-500 active:bg-gray-600 disabled:opacity-40"
          >
            不参加
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
        bulkMode={bulkMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
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
