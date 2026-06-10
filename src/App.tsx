import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SetupPage } from '@/pages/SetupPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { EmilRoute } from '@/routes/EmilRoute'
import { NonEmilRoute } from '@/routes/NonEmilRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'

const CalendarPage = lazy(() =>
  import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const DailyTasksPage = lazy(() =>
  import('@/pages/DailyTasksPage').then((m) => ({ default: m.DailyTasksPage })),
)
const LunaLigaPage = lazy(() =>
  import('@/pages/LunaLigaPage').then((m) => ({ default: m.LunaLigaPage })),
)
const AdminTodoPage = lazy(() =>
  import('@/pages/AdminTodoPage').then((m) => ({ default: m.AdminTodoPage })),
)
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const SponsorsPage = lazy(() =>
  import('@/pages/SponsorsPage').then((m) => ({ default: m.SponsorsPage })),
)
const CollaborationsPage = lazy(() =>
  import('@/pages/CollaborationsPage').then((m) => ({ default: m.CollaborationsPage })),
)
const CompanyEventsPage = lazy(() =>
  import('@/pages/CompanyEventsPage').then((m) => ({ default: m.CompanyEventsPage })),
)
const EmilPage = lazy(() => import('@/pages/EmilPage').then((m) => ({ default: m.EmilPage })))

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupPage />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="nyheder/*" element={<Navigate to="/" replace />} />
                  <Route element={<NonEmilRoute />}>
                    <Route path="goremal" element={<DailyTasksPage />} />
                  </Route>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
