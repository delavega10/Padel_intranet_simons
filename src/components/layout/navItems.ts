import {
  LayoutDashboard,
  Calendar,
  FileText,
  Dumbbell,
  Shield,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
  trainerOnly?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/goremal', label: 'Daglige opgaver', icon: ClipboardList },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/dokumenter', label: 'Dokumenter', icon: FileText },
  { to: '/traener', label: 'Trænerområde', icon: Dumbbell, trainerOnly: true },
  { to: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
]
