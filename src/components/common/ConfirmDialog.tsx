import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  message,
  confirmLabel = '削除',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="確認">
      <p className="text-gray-700 mb-5">{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          キャンセル
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
