import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', label: '試合', icon: '🏸' },
  { to: '/players', label: '選手', icon: '👥' },
  { to: '/team', label: 'チーム', icon: '🤝' },
  { to: '/history', label: '履歴', icon: '📊' },
  { to: '/settings', label: '設定', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 min-h-[58px] text-xs font-medium transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-10 h-8 flex items-center justify-center rounded-xl text-xl leading-none mb-0.5 transition-colors ${isActive ? 'bg-green-50' : ''}`}>
                  {icon}
                </span>
                <span className={`transition-colors ${isActive ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
