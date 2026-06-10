import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardSidePanels } from '@/components/dashboard/DashboardSidePanels'
import { Logo } from '@/components/ui/Logo'
import { GlobalSearch } from './GlobalSearch'
import { SidebarProfile } from './SidebarProfile'
import {
  navItems,
  filterNavItem,
  navSectionLabels,
  isExternalLinkConfigured,
  type NavSection,
} from './navItems'

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
  const { isAdmin, isEmil } = useAuth()
  const [query, setQuery] = useState('')

  const visibleItems = navItems.filter(
    (item) =>
      filterNavItem(item, { isAdmin, isEmil }) &&
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
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
          <div className="relative p-4 border-b border-gray-200">
            <Logo className="mx-auto w-52" />
            <button
              type="button"
              onClick={closeDrawer}
              className="lg:hidden absolute right-2 top-2 p-2 rounded-full bg-white/80 hover:bg-gray-100"
              aria-label="Luk menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <GlobalSearch query={query} setQuery={setQuery} onNavigate={closeDrawer} />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {visibleItems.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">Ingen menupunkter matcher søgningen</p>
            )}
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

            {showMobileDrawer && (
              <div className="lg:hidden space-y-4 pt-4">
                <DashboardSidePanels onNavigate={closeDrawer} />
              </div>
            )}
          </nav>

          <SidebarProfile />
        </div>
      </aside>
    </>
  )
}
