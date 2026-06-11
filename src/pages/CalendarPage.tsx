import { useCallback, useEffect, useState } from 'react'
import { Calendar, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { deleteCalendarEvent } from '@/lib/calendarEvents'
import { CalendarEventForm } from '@/components/calendar/CalendarEventForm'
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
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: loadError } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })

    if (loadError) {
      setError(loadError.message)
    } else if (data) {
      setEvents(data as Event[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreateForm() {
    setEditingEvent(null)
    setShowForm(true)
    setError(null)
  }

  function openEditForm(event: Event) {
    setEditingEvent(event)
    setShowForm(true)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingEvent(null)
  }

  function handleSaved() {
    closeForm()
    setLoading(true)
    load()
  }

  async function handleDelete(event: Event) {
    if (!confirm(`Slet «${event.title}»?`)) return
    setError(null)
    setDeletingId(event.id)
    const { error: deleteError } = await deleteCalendarEvent(event.id)
    setDeletingId(null)
    if (deleteError) {
      setError(deleteError)
      return
    }
    if (editingEvent?.id === event.id) closeForm()
    setEvents((current) => current.filter((e) => e.id !== event.id))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Kalender"
        description="Kommende events og aktiviteter"
        icon={Calendar}
        action={
          isAdmin ? (
            <Button onClick={openCreateForm} disabled={showForm && !editingEvent}>
              <Plus className="h-4 w-4" />
              Nyt event
            </Button>
          ) : undefined
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isAdmin && showForm && (
        <CalendarEventForm
          editingEvent={editingEvent}
          onCancel={closeForm}
          onSaved={handleSaved}
        />
      )}

      {events.length === 0 ? (
        <EmptyState
          title="Ingen kommende events"
          description={isAdmin ? 'Klik «Nyt event» for at oprette det første.' : 'Tjek igen senere.'}
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle>{event.title}</CardTitle>
                  <CardMeta>
                    {formatDate(event.event_date)}
                    {event.event_time && ` kl. ${formatTime(event.event_time)}`}
                  </CardMeta>
                  {event.responsible_person && (
                    <p className="mt-2 text-sm text-padel-600">
                      Ansvarlig: {event.responsible_person}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-1 self-start">
                    <button
                      type="button"
                      onClick={() => openEditForm(event)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-padel-700"
                      aria-label={`Rediger ${event.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      disabled={deletingId === event.id}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Slet ${event.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
