import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AuthProvider } from '@/contexts/AuthContext'
import { SetupPage } from '@/pages/SetupPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { AdminPage } from '@/pages/AdminPage'
import { DailyTasksPage } from '@/pages/DailyTasksPage'
import { LunaLigaPage } from '@/pages/LunaLigaPage'
import { AdminTodoPage } from '@/pages/AdminTodoPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { SponsorsPage } from '@/pages/SponsorsPage'
import { CollaborationsPage } from '@/pages/CollaborationsPage'
import { CompanyEventsPage } from '@/pages/CompanyEventsPage'
import { EmilPage } from '@/pages/EmilPage'
import { EmilRoute } from '@/routes/EmilRoute'

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
              <Route path="kalender" element={<CalendarPage />} />

              <Route element={<EmilRoute />}>
                <Route path="emil" element={<EmilPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="lunaliga" element={<LunaLigaPage />} />
                <Route path="bestillinger" element={<OrdersPage />} />
                <Route path="sponsorer" element={<SponsorsPage />} />
                <Route path="samarbejde" element={<CollaborationsPage />} />
                <Route path="firma-events" element={<CompanyEventsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="admin-todo" element={<AdminTodoPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
