import type { PlayerStatus } from '@/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/constants'

export default function StatusBadge({ status }: { status: PlayerStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
