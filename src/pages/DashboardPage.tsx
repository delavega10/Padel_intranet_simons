import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Newspaper,
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { NewsFeed } from '@/components/news/NewsFeed'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/format'
import type { EmployeeCase, Event } from '@/types'

const quickLinks = [
  { to: '/goremal', label: 'Daglige opgaver', icon: ClipboardList },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
]

export function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [openCases, setOpenCases] = useState<EmployeeCase[]>([])
  const [loading, setLoading] = useState(true)
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

      if (isAdmin) {
        const { data: cases } = await supabase
          .from('employee_cases')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5)
        if (cases) setOpenCases(cases as EmployeeCase[])
      }

      setLoading(false)
    }
    load()
  }, [isAdmin])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'kollega'

  if (loading) return <LoadingSpinner />

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase">
          SimonsPadel Intranet
        </h1>
        <p className="mt-2 text-gray-600 normal-case">
          Velkommen, {firstName} — her er dit overblik
        </p>
      </div>

      {isAdmin && openCases.length > 0 && (
        <Link
          to="/goremal"
          className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100/80"
        >
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {openCases.length} åben{openCases.length === 1 ? '' : 'e'} sag
              {openCases.length === 1 ? '' : 'er'} fra medarbejdere
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Seneste: {openCases[0].title} — klik for at se og løse
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 shrink-0 self-center text-amber-700" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 normal-case">
            <Newspaper className="h-5 w-5 text-padel-600" />
            Nyhedsfeed
          </h2>
          <NewsFeed showComposer showHeader={false} />
        </div>

        <div className="space-y-4">
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-padel-50 hover:text-padel-700"
                  >
                    <Icon className="h-4 w-4 text-padel-600" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
