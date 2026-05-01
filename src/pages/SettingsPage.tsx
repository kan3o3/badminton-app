import { useState } from 'react'
import useAppStore from '@/store/useAppStore'
import Button from '@/components/common/Button'
import ConfirmDialog from '@/components/common/ConfirmDialog'

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
        >
          −
        </button>
        <span className="w-16 text-center text-base font-bold text-gray-800">
          {format ? format(value) : value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
        >
          ＋
        </button>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        style={{ transform: value ? 'translateX(26px)' : 'translateX(2px)' }}
        className="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
      />
    </button>
  )
}

function formatTimer(seconds: number) {
  if (seconds === 0) return 'なし'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}分` : `${m}:${String(s).padStart(2, '0')}`
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2 mt-5">{children}</h2>
  )
}

export default function SettingsPage() {
  const courtConfig = useAppStore((s) => s.courtConfig)
  const setCourtConfig = useAppStore((s) => s.setCourtConfig)
  const setCourtFormat = useAppStore((s) => s.setCourtFormat)
  const resetSession = useAppStore((s) => s.resetSession)
  const activeMatches = useAppStore((s) => s.activeMatches)

  const [resetOpen, setResetOpen] = useState(false)

  const handleReset = () => {
    resetSession()
    setResetOpen(false)
  }

  const rankBalanceEnabled = courtConfig.rankBalanceEnabled ?? true

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-1 pt-1">設定</h1>

      {/* ── コート設定 ── */}
      <SectionHeader>コート</SectionHeader>
      <div className="space-y-2">
        <Stepper
          label="コート数"
          value={courtConfig.totalCourts}
          min={1}
          max={10}
          onChange={(v) => setCourtConfig({ totalCourts: v })}
          format={(v) => `${v}面`}
        />

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-medium text-gray-700 mb-0.5">デフォルト形式</p>
          <p className="text-xs text-gray-400 mb-3">コート個別に設定していない場合に適用</p>
          <div className="flex gap-2">
            {(['doubles', 'singles'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setCourtConfig({ format: fmt })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  courtConfig.format === fmt
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {fmt === 'doubles' ? 'ダブルス' : 'シングルス'}
              </button>
            ))}
          </div>
        </div>

        {courtConfig.totalCourts > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-medium text-gray-700 mb-3">コート別形式</p>
            <div className="space-y-2.5">
              {Array.from({ length: courtConfig.totalCourts }, (_, i) => {
                const fmt = courtConfig.courtFormats[i] ?? courtConfig.format
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">コート {i + 1}</span>
                    <div className="flex gap-1.5">
                      {(['doubles', 'singles'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setCourtFormat(i, f)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            fmt === f
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {f === 'doubles' ? 'ダブルス' : 'シングルス'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 試合設定 ── */}
      <SectionHeader>試合</SectionHeader>
      <div className="space-y-2">
        <Stepper
          label="試合時間"
          value={courtConfig.timerDefaultSeconds / 60}
          min={0}
          max={30}
          onChange={(v) => setCourtConfig({ timerDefaultSeconds: v * 60 })}
          format={(v) => formatTimer(v * 60)}
        />

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700">レベル差を考慮した組み合わせ</p>
            <p className="text-xs text-gray-400 mt-0.5">OFFにするとランクを無視してマッチング</p>
          </div>
          <Toggle
            value={rankBalanceEnabled}
            onChange={(v) => setCourtConfig({ rankBalanceEnabled: v })}
          />
        </div>
      </div>

      {/* ── セッション ── */}
      <SectionHeader>セッション</SectionHeader>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-3">
          試合履歴・進行中のコートをすべてリセットします。
          {activeMatches.length > 0 && (
            <span className="text-orange-500 font-medium">（進行中の試合があります）</span>
          )}
        </p>
        <Button variant="danger" className="w-full" onClick={() => setResetOpen(true)}>
          セッションをリセット
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        message="今日の試合履歴と進行中のコートをすべてリセットします。この操作は元に戻せません。"
        confirmLabel="リセット"
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  )
}
