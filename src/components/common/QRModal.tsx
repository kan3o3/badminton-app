import { QRCodeSVG } from 'qrcode.react'
import Modal from './Modal'
import Button from './Button'

interface QRModalProps {
  open: boolean
  onClose: () => void
  sessionId: string
}

export default function QRModal({ open, onClose, sessionId }: QRModalProps) {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  const viewUrl = `${base}#/view/${sessionId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(viewUrl).catch(() => {})
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="観戦用QRコード"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} className="flex-1">
            URLをコピー
          </Button>
          <Button onClick={onClose} className="flex-1">
            閉じる
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <QRCodeSVG value={viewUrl} size={200} />
        </div>
        <p className="text-sm text-gray-500 text-center">
          QRコードを読み取ると試合状況を観戦できます
        </p>
        <p className="text-xs text-gray-400 break-all text-center px-2">{viewUrl}</p>
      </div>
    </Modal>
  )
}
