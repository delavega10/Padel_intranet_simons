import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardMeta, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTime } from '@/lib/format'
import type { Event } from '@/types'

export function CalendarPage() {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as Event[])
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Kalender"
        description="Kommende events og aktiviteter"
        icon={Calendar}
        action={
          isAdmin ? (
            <Link to="/admin?tab=events">
              <Button>
                <Plus className="h-4 w-4" />
                Nyt event
              </Button>
            </Link>
          ) : undefined
        }
      />

      {events.length === 0 ? (
        <EmptyState title="Ingen kommende events" description="Tjek igen senere." />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{event.title}</CardTitle>
                  <CardMeta>
                    {formatDate(event.event_date)}
                    {event.event_time && ` kl. ${formatTime(event.event_time)}`}
                  </CardMeta>
                  {event.responsible_person && (
                    <p className="mt-2 text-sm text-padel-400">
                      Ansvarlig: {event.responsible_person}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
