import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatDate, formatTime } from '@/lib/format'
import type { Event } from '@/types'

const emptyForm = {
  title: '',
  event_date: new Date().toISOString().slice(0, 10),
  event_time: '',
  description: '',
  responsible_person: '',
}

export function AdminEventsTab() {
  const { user } = useAuth()
  const [items, setItems] = useState<Event[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    if (data) setItems(data as Event[])
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(item: Event) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      event_date: item.event_date,
      event_time: item.event_time?.slice(0, 5) ?? '',
      description: item.description ?? '',
      responsible_person: item.responsible_person ?? '',
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      event_date: form.event_date,
      event_time: form.event_time || null,
      description: form.description || null,
      responsible_person: form.responsible_person || null,
      created_by: user?.id,
    }

    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId)
    } else {
      await supabase.from('events').insert(payload)
    }

    setSaving(false)
    setEditingId(null)
    setForm(emptyForm)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Slet dette event?')) return
    await supabase.from('events').delete().eq('id', id)
    await load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold text-gray-900 normal-case">{editingId ? 'Rediger event' : 'Opret event'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Titel" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dato" type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            <Input label="Tidspunkt" type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
          </div>
          <Input label="Ansvarlig person" value={form.responsible_person} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} />
          <Textarea label="Beskrivelse" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>{editingId ? 'Gem' : 'Opret'}</Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
                Annuller
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{item.title}</CardTitle>
              <p className="text-sm text-gray-500">
                {formatDate(item.event_date)}
                {item.event_time && ` kl. ${formatTime(item.event_time)}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-900/30">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
