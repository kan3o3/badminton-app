import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from '@/components/layout/BottomNav'
import HomePage from '@/pages/HomePage'
import PlayersPage from '@/pages/PlayersPage'
import SettingsPage from '@/pages/SettingsPage'
import HistoryPage from '@/pages/HistoryPage'

export default function App() {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-svh bg-gray-100">
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  )
}
