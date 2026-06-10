import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LayoutDashboard,
  User,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime } from '@/lib/format'
import type { Event } from '@/types'

const employeeQuickLinks = [
  { to: '/goremal', label: 'Daglige opgaver', icon: ClipboardList },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
]

const emilQuickLinks = [
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/emil', label: 'Emil', icon: User },
]

interface DashboardSidePanelsProps {
  /** Kaldes ved klik på et link (bruges til at lukke mobilmenuen) */
  onNavigate?: () => void
}

export function DashboardSidePanels({ onNavigate }: DashboardSidePanelsProps) {
  const { isAdmin, isEmil } = useAuth()
  const quickLinks = isEmil && !isAdmin ? emilQuickLinks : employeeQuickLinks
  const [events, setEvents] = useState<Event[]>([])
  const [sectionsOpen, setSectionsOpen] = useState({ events: true, links: true })

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5)

      if (data) setEvents(data as Event[])
    }
    load()
  }, [])

  return (
    <>
      <section className="content-card overflow-hidden p-0">
        <button
          type="button"
          className="section-toggle"
          onClick={() => setSectionsOpen((s) => ({ ...s, events: !s.events }))}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-padel-600" />
            Kommende events
          </span>
          {sectionsOpen.events ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {sectionsOpen.events && (
          <div className="px-4 pb-4 space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">Ingen kommende events</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(event.event_date)}
                    {event.event_time && ` kl. ${formatTime(event.event_time)}`}
                  </p>
                </div>
              ))
            )}
            <Link
              to="/kalender"
              onClick={onNavigate}
              className="inline-flex items-center gap-1 text-sm text-padel-600 hover:text-padel-700"
            >
              Kalender <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </section>

      <section className="content-card overflow-hidden p-0">
        <button
          type="button"
          className="section-toggle"
          onClick={() => setSectionsOpen((s) => ({ ...s, links: !s.links }))}
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-padel-600" />
            Hurtige links
          </span>
          {sectionsOpen.links ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {sectionsOpen.links && (
          <div className="px-4 pb-4 space-y-2">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-padel-50 hover:text-padel-700"
              >
                <Icon className="h-4 w-4 text-padel-600" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
