import {
  LayoutDashboard,
  Calendar,
  Shield,
  ClipboardList,
  ListTodo,
  ClipboardList as ClipboardListIcon,
  Trophy,
  CalendarRange,
  ExternalLink,
  CalendarClock,
  DoorOpen,
  Coffee,
  Flag,
  Handshake,
  Users,
  Building2,
  User,
  Image,
  type LucideIcon,
} from 'lucide-react'
import { siteLinks, isExternalLinkConfigured } from '@/config/siteLinks'
import { EMIL_ALLOWED_PATHS, isEmilOnlyUser } from '@/lib/emilAccess'

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
  emilOnly?: boolean
}

const externalNavItems: NavItem[] = [
  {
    href: siteLinks.vagtplan,
    label: 'Vagtplan',
    icon: CalendarClock,
    section: 'links',
    adminOnly: true,
  },
  {
    href: siteLinks.padelplus,
    label: 'PadelPlus',
    icon: ExternalLink,
    section: 'links',
    adminOnly: true,
  },
  {
    href: siteLinks.bookingMoedelokale,
    label: 'Booking mødelokale',
    icon: DoorOpen,
    section: 'links',
    adminOnly: true,
  },
  {
    href: siteLinks.cafe,
    label: 'Cafe',
    icon: Coffee,
    section: 'links',
    adminOnly: true,
  },
  {
    href: siteLinks.simgolf,
    label: 'SimGolf',
    icon: Flag,
    section: 'links',
    adminOnly: true,
  },
]

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/goremal', label: 'Daglige opgaver', icon: ClipboardList, section: 'main' },
  { to: '/kalender', label: 'Kalender', icon: Calendar, section: 'main' },
  { to: '/lunaliga', label: 'LunaLiga oversigt', icon: Trophy, section: 'main', adminOnly: true },
  { to: '/faste-baner', label: 'Faste baner', icon: CalendarRange, section: 'main', adminOnly: true },
  { to: '/bestillinger', label: 'Huskeseddel', icon: ClipboardListIcon, section: 'main', adminOnly: true },
  { to: '/sponsorer', label: 'Sponsorer', icon: Handshake, section: 'main', adminOnly: true },
  {
    to: '/sponsor-grafik',
    label: 'Sponsor-grafik',
    icon: Image,
    section: 'main',
    adminOnly: true,
  },
  { to: '/samarbejde', label: 'Samarbejde', icon: Users, section: 'main', adminOnly: true },
  { to: '/firma-events', label: 'Firma events', icon: Building2, section: 'main', adminOnly: true },
  { to: '/emil', label: 'Emil', icon: User, section: 'main', emilOnly: true },
  ...externalNavItems,
  {
    to: '/admin-todo',
    label: 'To-do liste',
    icon: ListTodo,
    section: 'admin',
    adminOnly: true,
  },
  { to: '/admin', label: 'Admin', icon: Shield, section: 'admin', adminOnly: true },
]

export function filterNavItem(
  item: NavItem,
  opts: { isAdmin: boolean; isEmil: boolean },
): boolean {
  if (item.to === '/nyheder') return false
  if (item.adminOnly && !opts.isAdmin) return false
  if (item.emilOnly && !opts.isAdmin && !opts.isEmil) return false
  if (isEmilOnlyUser(opts.isEmil, opts.isAdmin)) {
    if (item.href) return false
    if (!item.to || !EMIL_ALLOWED_PATHS.includes(item.to)) return false
  }
  return true
}

export { isExternalLinkConfigured }

export const navSectionLabels: Record<NavSection, string | null> = {
  main: null,
  links: 'Links',
  admin: 'Administrator',
}
