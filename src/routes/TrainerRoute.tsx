import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function TrainerRoute() {
  const { isAdmin, isTrainer } = useAuth()
  if (!isAdmin && !isTrainer) return <Navigate to="/" replace />
  return <Outlet />
}
