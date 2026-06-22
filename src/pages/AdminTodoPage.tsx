import { useCallback, useEffect, useState } from 'react'
import { Check, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  ADMIN_TODO_PRIORITY_LABELS,
  ADMIN_TODO_PRIORITY_ORDER,
  type AdminTodo,
  type AdminTodoPriority,
} from '@/types'

const priorityBadgeClass: Record<AdminTodoPriority, string> = {
  hoj: 'bg-red-100 text-red-800 border-red-200',
  mellem: 'bg-amber-100 text-amber-800 border-amber-200',
  lav: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function AdminTodoPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<AdminTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<AdminTodoPriority>('mellem')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'alle' | 'aktive' | 'faerdige'>('aktive')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('admin_todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      const sorted = (data as AdminTodo[]).sort(
        (a, b) =>
          ADMIN_TODO_PRIORITY_ORDER[a.priority] - ADMIN_TODO_PRIORITY_ORDER[b.priority],
      )
      setTodos(sorted)
    }
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
    setEditingId(null)
    setTitle('')
    setDescription('')
    setPriority('mellem')
  }

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setPriority('mellem')
    setFormOpen(true)
  }

  function openEdit(todo: AdminTodo) {
    setEditingId(todo.id)
    setTitle(todo.title)
    setDescription(todo.description)
    setPriority(todo.priority)
    setFormOpen(true)
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return
    setSaving(true)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
    }

    if (editingId) {
      await supabase.from('admin_todos').update(payload).eq('id', editingId)
    } else {
      await supabase.from('admin_todos').insert({
        ...payload,
        created_by: user.id,
      })
    }

    setSaving(false)
    resetForm()
    await load()
  }

  async function toggleComplete(todo: AdminTodo) {
    await supabase
      .from('admin_todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)
    await load()
  }

  async function deleteTodo(id: string) {
    if (!confirm('Slet opgaven?')) return
    await supabase.from('admin_todos').delete().eq('id', id)
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="To-do liste"
        description="Privat admin-liste — kun synlig for administratorer"
        icon={ListTodo}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ny opgave
          </Button>
        }
      />

      <Modal
        open={formOpen}
        onClose={resetForm}
        title={editingId ? 'Rediger opgave' : 'Ny opgave'}
      >
        <form onSubmit={saveTodo} className="space-y-4">
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
          <Select
            label="Prioritet"
            value={priority}
            onChange={(e) => setPriority(e.target.value as AdminTodoPriority)}
          >
            {(Object.keys(ADMIN_TODO_PRIORITY_LABELS) as AdminTodoPriority[]).map((p) => (
              <option key={p} value={p}>
                {ADMIN_TODO_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" loading={saving}>
              {editingId ? 'Gem ændringer' : 'Tilføj opgave'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Annuller
            </Button>
          </div>
        </form>
      </Modal>

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
              filter === id
                ? 'bg-padel-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
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
            filter === 'aktive'
              ? 'Klik «Ny opgave» for at oprette en opgave.'
              : 'Ingen opgaver i denne visning.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((todo) => (
            <li key={todo.id}>
              <Card
                className={`flex items-start gap-3 ${
                  todo.completed ? 'opacity-70' : ''
                }`}
              >
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-semibold text-gray-900 ${
                        todo.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {todo.title}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        priorityBadgeClass[todo.priority]
                      }`}
                    >
                      {ADMIN_TODO_PRIORITY_LABELS[todo.priority]}
                    </span>
                  </div>
                  {todo.description && (
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                      {todo.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(todo)}
                    className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-padel-700"
                    aria-label={`Rediger ${todo.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Slet ${todo.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
