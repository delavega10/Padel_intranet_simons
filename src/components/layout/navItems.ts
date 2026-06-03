import {
  LayoutDashboard,
  Calendar,
  FileText,
  Dumbbell,
  Shield,
  ClipboardList,
  ListTodo,
  Trophy,
  ExternalLink,
  CalendarClock,
  DoorOpen,
  Coffee,
  Flag,
  type LucideIcon,
} from 'lucide-react'
import { siteLinks, isExternalLinkConfigured } from '@/config/siteLinks'

export type NavSection = 'main' | 'links' | 'admin'

export interface NavItem {
  /** Intern route (react-router) */
  to?: string
  /** Ekstern URL */
  href?: string
  label: string
  icon: LucideIcon
  section: NavSection
  adminOnly?: boolean
  trainerOnly?: boolean
}

const externalNavItems: NavItem[] = [
  {
    href: siteLinks.vagtplan,
    label: 'Vagtplan',
    icon: CalendarClock,
    section: 'links',
  },
  {
    href: siteLinks.padelplus,
    label: 'PadelPlus',
    icon: ExternalLink,
    section: 'links',
  },
  {
    href: siteLinks.bookingMoedelokale,
    label: 'Booking mødelokale',
    icon: DoorOpen,
    section: 'links',
  },
  {
    href: siteLinks.cafe,
    label: 'Cafe',
    icon: Coffee,
    section: 'links',
  },
  {
    href: siteLinks.simgolf,
    label: 'SimGolf',
    icon: Flag,
    section: 'links',
  },
]

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/goremal', label: 'Daglige opgaver', icon: ClipboardList, section: 'main' },
  { to: '/lunaliga', label: 'LunaLiga oversigt', icon: Trophy, section: 'main' },
  { to: '/kalender', label: 'Kalender', icon: Calendar, section: 'main' },
  { to: '/dokumenter', label: 'Dokumenter', icon: FileText, section: 'main' },
  { to: '/traener', label: 'Trænerområde', icon: Dumbbell, section: 'main', trainerOnly: true },
  ...externalNavItems,
  {
    to: '/goremal',
    label: 'To-do liste',
    icon: ListTodo,
    section: 'admin',
    adminOnly: true,
  },
  { to: '/admin', label: 'Admin', icon: Shield, section: 'admin', adminOnly: true },
]

export function filterNavItem(
  item: NavItem,
  opts: { isAdmin: boolean; isTrainer: boolean },
): boolean {
  if (item.to === '/nyheder') return false
  if (item.adminOnly && !opts.isAdmin) return false
  if (item.trainerOnly && !opts.isAdmin && !opts.isTrainer) return false
  return true
}

export { isExternalLinkConfigured }

export const navSectionLabels: Record<NavSection, string | null> = {
  main: null,
  links: 'Links',
  admin: 'Administrator',
}
