import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import type { Event } from '@/types'

const emptyForm = {
  title: '',
  event_date: new Date().toISOString().slice(0, 10),
  event_time: '',
  description: '',
  responsible_person: '',
}

interface CalendarEventFormProps {
  editingEvent: Event | null
  onCancel: () => void
  onSaved: () => void
}

export function CalendarEventForm({ editingEvent, onCancel, onSaved }: CalendarEventFormProps) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        event_date: editingEvent.event_date,
        event_time: editingEvent.event_time?.slice(0, 5) ?? '',
        description: editingEvent.description ?? '',
        responsible_person: editingEvent.responsible_person ?? '',
      })
    } else {
      setForm(emptyForm)
    }
    setError(null)
  }, [editingEvent])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const fields = {
      title: form.title,
      event_date: form.event_date,
      event_time: form.event_time || null,
      description: form.description || null,
      responsible_person: form.responsible_person || null,
    }

    const result = editingEvent
      ? await supabase.from('events').update(fields).eq('id', editingEvent.id)
      : await supabase.from('events').insert({ ...fields, created_by: user?.id })

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }

    onSaved()
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-4 font-semibold text-gray-900 normal-case">
        {editingEvent ? 'Rediger event' : 'Opret event'}
      </h3>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titel"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Dato"
            type="date"
            required
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
          <Input
            label="Tidspunkt"
            type="time"
            value={form.event_time}
            onChange={(e) => setForm({ ...form, event_time: e.target.value })}
          />
        </div>
        <Input
          label="Ansvarlig person"
          value={form.responsible_person}
          onChange={(e) => setForm({ ...form, responsible_person: e.target.value })}
        />
        <Textarea
          label="Beskrivelse"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            {editingEvent ? 'Gem' : 'Opret'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuller
          </Button>
        </div>
      </form>
    </Card>
  )
}
