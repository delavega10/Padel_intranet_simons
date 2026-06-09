import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function EmilRoute() {
  const { isAdmin, isEmil } = useAuth()
  if (!isAdmin && !isEmil) return <Navigate to="/" replace />
  return <Outlet />
}
