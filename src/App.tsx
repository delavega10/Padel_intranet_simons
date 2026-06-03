import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AuthProvider } from '@/contexts/AuthContext'
import { SetupPage } from '@/pages/SetupPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { TrainerRoute } from '@/routes/TrainerRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { TrainingPage } from '@/pages/TrainingPage'
import { AdminPage } from '@/pages/AdminPage'
import { DailyTasksPage } from '@/pages/DailyTasksPage'
import { LunaLigaPage } from '@/pages/LunaLigaPage'

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupPage />
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="nyheder/*" element={<Navigate to="/" replace />} />
              <Route path="goremal" element={<DailyTasksPage />} />
              <Route path="lunaliga" element={<LunaLigaPage />} />
              <Route path="kalender" element={<CalendarPage />} />
              <Route path="dokumenter" element={<DocumentsPage />} />

              <Route element={<TrainerRoute />}>
                <Route path="traener" element={<TrainingPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
