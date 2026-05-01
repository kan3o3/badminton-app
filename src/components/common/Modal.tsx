import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex flex-col items-center justify-end sm:justify-center bg-black/40"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden"
        style={{ maxHeight: '95dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
