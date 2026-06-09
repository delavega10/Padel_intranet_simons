import { useCallback, useEffect, useState } from 'react'
import { Check, Plus, Trash2, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { EmilTodo } from '@/types'

export function EmilPage() {
  const { user, isAdmin } = useAuth()
  const [todos, setTodos] = useState<EmilTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'aktive' | 'alle' | 'faerdige'>('aktive')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('emil_todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setTodos(data as EmilTodo[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = todos.filter((t) => {
    if (filter === 'aktive') return !t.completed
    if (filter === 'faerdige') return t.completed
    return true
  })

  function resetForm() {
    setFormOpen(false)
    setTitle('')
    setDescription('')
  }

  function openCreate() {
    setTitle('')
    setDescription('')
    setFormOpen(true)
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !user || !title.trim()) return
    setSaving(true)
    await supabase.from('emil_todos').insert({
      title: title.trim(),
      description: description.trim(),
      created_by: user.id,
    })
    setSaving(false)
    resetForm()
    await load()
  }

  async function toggleComplete(todo: EmilTodo) {
    await supabase.from('emil_todos').update({ completed: !todo.completed }).eq('id', todo.id)
    await load()
  }

  async function deleteTodo(id: string) {
    if (!isAdmin || !confirm('Slet opgaven?')) return
    await supabase.from('emil_todos').delete().eq('id', id)
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emil"
        description={
          isAdmin
            ? 'Opgaveliste til Emil — kun han og admin kan se denne side'
            : 'Dine opgaver fra admin'
        }
        icon={User}
        action={
          isAdmin ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Ny opgave
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <Modal open={formOpen} onClose={resetForm} title="Ny opgave til Emil">
          <form onSubmit={addTodo} className="space-y-4">
            <Input
              label="Overskrift"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kort titel"
              required
            />
            <Textarea
              label="Beskrivelse"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaljer om opgaven..."
              rows={3}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" loading={saving}>
                Tilføj opgave
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Annuller
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['aktive', 'Aktive'],
            ['alle', 'Alle'],
            ['faerdige', 'Færdige'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === id ? 'bg-padel-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Ingen opgaver"
          description={
            isAdmin
              ? filter === 'aktive'
                ? 'Klik «Ny opgave» for at oprette en opgave til Emil.'
                : 'Ingen opgaver i denne visning.'
              : 'Du har ingen opgaver lige nu.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((todo) => (
            <li key={todo.id}>
              <Card className={`flex items-start gap-3 ${todo.completed ? 'opacity-70' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleComplete(todo)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    todo.completed
                      ? 'border-green-600 bg-green-500 text-white'
                      : 'border-gray-300 bg-white hover:border-padel-500'
                  }`}
                  aria-label={todo.completed ? 'Marker som aktiv' : 'Marker som færdig'}
                >
                  {todo.completed && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-gray-900 ${
                      todo.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                      {todo.description}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Slet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
