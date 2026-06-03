import { NavLink } from 'react-router-dom'
import { ExternalLink, LogOut, Search, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  navItems,
  filterNavItem,
  navSectionLabels,
  isExternalLinkConfigured,
  type NavSection,
} from './navItems'
import { ROLE_LABELS } from '@/types'

interface SidebarProps {
  showMobileDrawer: boolean
  setShowMobileDrawer: (open: boolean) => void
}

const sectionOrder: NavSection[] = ['main', 'links', 'admin']

function NavItemLink({
  item,
  onNavigate,
}: {
  item: (typeof navItems)[number]
  onNavigate: () => void
}) {
  const { label, icon: Icon, to, href } = item
  const className = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
    }`

  if (href !== undefined) {
    const configured = isExternalLinkConfigured(href)
    if (!configured) {
      return (
        <span
          title="Tilføj link i .env (VITE_LINK_*)"
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400"
        >
          <Icon className="h-5 w-5 shrink-0 opacity-60" />
          <span className="flex-1">{label}</span>
        </span>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="sidebar-item-inactive flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100"
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1">{label}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </a>
    )
  }

  return (
    <NavLink
      to={to!}
      end={to === '/'}
      onClick={onNavigate}
      className={className}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </NavLink>
  )
}

export function Sidebar({ showMobileDrawer, setShowMobileDrawer }: SidebarProps) {
  const { profile, signOut, isAdmin, isTrainer } = useAuth()

  const visibleItems = navItems.filter((item) =>
    filterNavItem(item, { isAdmin, isTrainer }),
  )

  const closeDrawer = () => setShowMobileDrawer(false)

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transition-transform duration-300
    ${showMobileDrawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `

  return (
    <>
      {showMobileDrawer && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeDrawer}
          aria-hidden
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-1 flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-padel-600 text-2xl font-bold text-white shadow-sm">
                P
              </div>
              <p className="mt-2 text-center text-sm font-bold text-gray-900 uppercase tracking-tight">
                Padel Intranet
              </p>
              <p className="text-xs text-gray-500">Klubintern portal</p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100"
              aria-label="Luk menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Søg"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-padel-500 focus:outline-none focus:ring-2 focus:ring-padel-500/30"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {sectionOrder.map((section) => {
              const items = visibleItems.filter((i) => i.section === section)
              if (items.length === 0) return null

              const showAdminHeader = section === 'admin' && isAdmin
              const showLinksHeader = section === 'links' && items.length > 0
              const header = navSectionLabels[section]

              return (
                <div key={section} className={section !== 'main' ? 'pt-4' : ''}>
                  {(showLinksHeader || showAdminHeader) && header && (
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {header}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => (
                      <NavItemLink
                        key={`${item.section}-${item.label}-${item.to ?? item.href}`}
                        item={item}
                        onNavigate={closeDrawer}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.full_name ?? profile?.email}
            </p>
            <p className="text-xs text-gray-500">
              {profile?.role ? ROLE_LABELS[profile.role] : ''}
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-padel-700"
            >
              <LogOut className="h-4 w-4" />
              Log ud
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
