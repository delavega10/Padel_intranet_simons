import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isEmilOnlyUser } from '@/lib/emilAccess'

/** Blokerer Emil-brugere fra medarbejder-sider (admin har stadig adgang). */
export function NonEmilRoute() {
  const { isAdmin, isEmil } = useAuth()
  if (isEmilOnlyUser(isEmil, isAdmin)) return <Navigate to="/" replace />
  return <Outlet />
}
