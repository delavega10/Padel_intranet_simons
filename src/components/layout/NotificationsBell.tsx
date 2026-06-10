import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, ClipboardList, Newspaper } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/format'

const SEEN_KEY = 'sp-notifications-seen'

interface NotificationItem {
  id: string
  label: string
  detail: string
  to: string
  type: 'news' | 'case' | 'todo'
}

function getLastSeen(): string {
  return localStorage.getItem(SEEN_KEY) ?? new Date(Date.now() - 7 * 86400000).toISOString()
}

const typeIcons = {
  news: Newspaper,
  case: AlertTriangle,
  todo: ClipboardList,
} as const

export function NotificationsBell() {
  const { user, isAdmin, isEmil } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const found: NotificationItem[] = []
    const lastSeen = getLastSeen()

    const { data: news } = await supabase
      .from('news')
      .select('id, title, content, author_name, created_at')
      .gt('created_at', lastSeen)
      .neq('author_id', user?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(5)

    for (const n of news ?? []) {
      found.push({
        id: n.id,
        label: n.title || n.content.slice(0, 50),
        detail: `Nyt opslag af ${n.author_name}`,
        to: '/',
        type: 'news',
      })
    }

    if (isAdmin) {
      const { data: cases } = await supabase
        .from('employee_cases')
        .select('id, title, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5)

      for (const c of cases ?? []) {
        found.push({
          id: c.id,
          label: c.title,
          detail: `Åben sag · ${formatDate(c.created_at.slice(0, 10))}`,
          to: '/goremal',
          type: 'case',
        })
      }
    }

    if (isEmil && !isAdmin) {
      const { data: todos } = await supabase
        .from('emil_todos')
        .select('id, title, created_at')
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(5)

      for (const t of todos ?? []) {
        found.push({
          id: t.id,
          label: t.title,
          detail: `Åben opgave · ${formatDate(t.created_at.slice(0, 10))}`,
          to: '/emil',
          type: 'todo',
        })
      }
    }

    setItems(found)
  }, [user?.id, isAdmin, isEmil])

  useEffect(() => {
    load()
    const interval = setInterval(load, 120000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function markAsSeen() {
    localStorage.setItem(SEEN_KEY, new Date().toISOString())
    setItems((current) => current.filter((i) => i.type !== 'news'))
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) load()
        }}
        className="relative rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
        aria-label={`Notifikationer${items.length > 0 ? ` (${items.length})` : ''}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900">Notifikationer</p>
            {items.some((i) => i.type === 'news') && (
              <button
                type="button"
                onClick={markAsSeen}
                className="text-xs text-padel-600 hover:text-padel-700"
              >
                Markér opslag som læst
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Ingen nye notifikationer
              </p>
            ) : (
              items.map((item) => {
                const Icon = typeIcons[item.type]
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-padel-50"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-padel-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                      <span className="block text-xs text-gray-500">{item.detail}</span>
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
