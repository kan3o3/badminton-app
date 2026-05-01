import type { Player } from '@/types'

interface WaitingListProps {
  playerIds: string[]
  players: Player[]
  gameCounts: Map<string, number>
  swapMode?: boolean
  selectedId?: string | null
  onSelectPlayer?: (id: string) => void
}

function PlayerChip({
  player,
  count,
  swapMode,
  isSelected,
  isTarget,
  onClick,
  dimmed,
}: {
  player: Player
  count: number
  swapMode: boolean
  isSelected: boolean
  isTarget: boolean
  onClick: () => void
  dimmed?: boolean
}) {
  return (
    <button
      disabled={!swapMode || dimmed}
      onClick={swapMode && !dimmed ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm transition-all ${
        dimmed
          ? 'bg-gray-50 text-gray-300 cursor-default'
          : swapMode
          ? isSelected
            ? 'bg-yellow-300 ring-2 ring-yellow-500 shadow-sm'
            : isTarget
            ? 'bg-green-100 ring-2 ring-green-400 cursor-pointer shadow-sm'
            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer active:bg-gray-300'
          : 'bg-gray-100 cursor-default'
      }`}
    >
      <span className={`font-semibold ${dimmed ? 'text-gray-300' : 'text-gray-800'}`}>{player.name}</span>
      {player.rank && (
        <span className={`text-[10px] font-bold px-1 py-0.5 rounded leading-none ${dimmed ? 'bg-gray-100 text-gray-300' : 'bg-blue-100 text-blue-600'}`}>
          {player.rank}
        </span>
      )}
      <span className={`text-[10px] font-medium px-1 py-0.5 rounded-full leading-none ${dimmed ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-400 border border-gray-200'}`}>
        {count}
      </span>
    </button>
  )
}

export default function WaitingList({
  playerIds,
  players,
  gameCounts,
  swapMode = false,
  selectedId = null,
  onSelectPlayer,
}: WaitingListProps) {
  const restingPlayers = players.filter((p) => p.status === 'resting')

  const hasWaiting = playerIds.length > 0
  const hasResting = restingPlayers.length > 0

  if (!hasWaiting && !hasResting) {
    return (
      <div className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 ${swapMode ? 'ring-2 ring-blue-400' : ''}`}>
        <span className="text-xs font-semibold text-gray-400">待機中</span>
        <span className="text-xs text-gray-300">なし</span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl px-4 py-3 shadow-sm space-y-3 ${swapMode ? 'ring-2 ring-blue-400' : ''}`}>
      {/* 待機中 */}
      {hasWaiting && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600">待機中</span>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{playerIds.length}人</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {playerIds.map((id) => {
              const player = players.find((p) => p.id === id)
              if (!player) return null
              return (
                <PlayerChip
                  key={id}
                  player={player}
                  count={gameCounts.get(id) ?? 0}
                  swapMode={swapMode}
                  isSelected={selectedId === id}
                  isTarget={swapMode && selectedId !== null && selectedId !== id}
                  onClick={() => onSelectPlayer?.(id)}
                  dimmed={false}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* 休憩中 */}
      {hasResting && (
        <div className={hasWaiting ? 'pt-2.5 border-t border-gray-100' : ''}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-400">休憩中</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-full">{restingPlayers.length}人</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {restingPlayers.map((player) => (
              <PlayerChip
                key={player.id}
                player={player}
                count={gameCounts.get(player.id) ?? 0}
                swapMode={false}
                isSelected={false}
                isTarget={false}
                onClick={() => {}}
                dimmed={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
