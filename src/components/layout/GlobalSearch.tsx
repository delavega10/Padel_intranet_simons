import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Newspaper, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/format'

interface SearchResult {
  id: string
  label: string
  detail: string
  to: string
  type: 'event' | 'news'
}

interface GlobalSearchProps {
  query: string
  setQuery: (q: string) => void
  onNavigate: () => void
}

/** Søger i menuen (via query-prop) og i events + nyhedsopslag i databasen. */
export function GlobalSearch({ query, setQuery, onNavigate }: GlobalSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const term = query.trim()

    if (term.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const pattern = `%${term}%`
      const [eventsRes, newsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date')
          .ilike('title', pattern)
          .order('event_date', { ascending: false })
          .limit(5),
        supabase
          .from('news')
          .select('id, title, content, author_name, created_at')
          .or(`content.ilike.${pattern},title.ilike.${pattern}`)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const found: SearchResult[] = []
      for (const e of eventsRes.data ?? []) {
        found.push({
          id: e.id,
          label: e.title,
          detail: formatDate(e.event_date),
          to: '/kalender',
          type: 'event',
        })
      }
      for (const n of newsRes.data ?? []) {
        found.push({
          id: n.id,
          label: n.title || n.content.slice(0, 60),
          detail: `${n.author_name} · ${formatDate(n.created_at.slice(0, 10))}`,
          to: '/',
          type: 'news',
        })
      }
      setResults(found)
      setSearching(false)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const showPanel = query.trim().length >= 2

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      <input
        type="search"
        placeholder="Søg…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Søg i menu, events og opslag"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-padel-500 focus:outline-none focus:ring-2 focus:ring-padel-500/30"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {searching && <p className="px-3 py-2 text-sm text-gray-500">Søger…</p>}
          {!searching && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">Ingen events eller opslag fundet</p>
          )}
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              to={r.to}
              onClick={() => {
                setQuery('')
                onNavigate()
              }}
              className="flex items-start gap-2 px-3 py-2 text-sm hover:bg-padel-50"
            >
              {r.type === 'event' ? (
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-padel-600" />
              ) : (
                <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-padel-600" />
              )}
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">{r.label}</span>
                <span className="block truncate text-xs text-gray-500">{r.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
