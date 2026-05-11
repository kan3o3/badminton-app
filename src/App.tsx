import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from '@/components/layout/BottomNav'
import HomePage from '@/pages/HomePage'
import PlayersPage from '@/pages/PlayersPage'
import SettingsPage from '@/pages/SettingsPage'
import HistoryPage from '@/pages/HistoryPage'
import ViewPage from '@/pages/ViewPage'

function AppLayout() {
  const location = useLocation()
  const isViewMode = location.pathname.startsWith('/view/')

  return (
    <div className="flex flex-col min-h-svh bg-gray-100">
      <main className={`flex-1 overflow-y-auto ${isViewMode ? '' : 'pb-20'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/view/:sessionId" element={<ViewPage />} />
        </Routes>
      </main>
      {!isViewMode && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  )
}
