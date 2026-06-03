import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ProtectedRoute() {
  const { session, loading, isApproved } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!session) return <Navigate to="/login" replace />

  if (!isApproved) return <Navigate to="/login" replace />

  return <Outlet />
}
