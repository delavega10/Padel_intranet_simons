import { useEffect, useState, type FormEvent } from 'react'
import { Dumbbell, Plus, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardMeta, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate } from '@/lib/format'
import type { TrainingNote } from '@/types'

const emptyForm = {
  team_name: '',
  level: '',
  note_date: new Date().toISOString().slice(0, 10),
  exercises: '',
  notes: '',
}

export function TrainingPage() {
  const { user, isAdmin, isTrainer } = useAuth()
  const canWrite = isAdmin || isTrainer
  const [notes, setNotes] = useState<TrainingNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadNotes() {
    const { data } = await supabase
      .from('training_notes')
      .select('*')
      .order('note_date', { ascending: false })
    if (data) setNotes(data as TrainingNote[])
    setLoading(false)
  }

  useEffect(() => {
    loadNotes()
  }, [])

  function startEdit(note: TrainingNote) {
    setEditingId(note.id)
    setForm({
      team_name: note.team_name,
      level: note.level,
      note_date: note.note_date,
      exercises: note.exercises ?? '',
      notes: note.notes ?? '',
    })
    setShowForm(true)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      team_name: form.team_name,
      level: form.level,
      note_date: form.note_date,
      exercises: form.exercises || null,
      notes: form.notes || null,
      author_id: user?.id,
    }

    if (editingId) {
      await supabase.from('training_notes').update(payload).eq('id', editingId)
    } else {
      await supabase.from('training_notes').insert(payload)
    }

    setSaving(false)
    resetForm()
    await loadNotes()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Trænerområde"
        description="Træningsnoter og øvelser til hold"
        icon={Dumbbell}
        action={
          canWrite ? (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Annuller' : 'Ny note'}
            </Button>
          ) : undefined
        }
      />

      {showForm && canWrite && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Holdnavn"
                required
                value={form.team_name}
                onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              />
              <Input
                label="Niveau"
                required
                placeholder="f.eks. begynder, mellem, elite"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              />
            </div>
            <Input
              label="Dato"
              type="date"
              required
              value={form.note_date}
              onChange={(e) => setForm({ ...form, note_date: e.target.value })}
            />
            <Textarea
              label="Øvelser"
              value={form.exercises}
              onChange={(e) => setForm({ ...form, exercises: e.target.value })}
            />
            <Textarea
              label="Noter"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {editingId ? 'Gem ændringer' : 'Opret note'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuller
              </Button>
            </div>
          </form>
        </Card>
      )}

      {notes.length === 0 ? (
        <EmptyState
          title="Ingen træningsnoter"
          description={canWrite ? 'Opret din første træningsnote.' : 'Trænere har endnu ikke oprettet noter.'}
        />
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>
                    {note.team_name} · {note.level}
                  </CardTitle>
                  <CardMeta>{formatDate(note.note_date)}</CardMeta>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-padel-700"
                    aria-label="Rediger"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
              {note.exercises && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-padel-500">Øvelser</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{note.exercises}</p>
                </div>
              )}
              {note.notes && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-padel-500">Noter</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{note.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
