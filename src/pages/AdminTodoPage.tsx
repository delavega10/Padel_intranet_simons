import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ListTodo, Pencil, Plus, Trash2, User } from 'lucide-react'
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
  type Profile,
} from '@/types'

const priorityBadgeClass: Record<AdminTodoPriority, string> = {
  hoj: 'bg-red-100 text-red-800 border-red-200',
  mellem: 'bg-amber-100 text-amber-800 border-amber-200',
  lav: 'bg-gray-100 text-gray-700 border-gray-200',
}

function adminDisplayName(profile: Pick<Profile, 'full_name' | 'email'>): string {
  if (profile.full_name?.trim()) {
    return profile.full_name.trim().split(/\s+/)[0] ?? profile.full_name
  }
  return profile.email.split('@')[0] ?? profile.email
}

export function AdminTodoPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<AdminTodo[]>([])
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<AdminTodoPriority>('mellem')
  const [assignedTo, setAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'alle' | 'aktive' | 'faerdige'>('aktive')
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  const adminById = useMemo(
    () => new Map(admins.map((admin) => [admin.id, admin])),
    [admins],
  )

  const load = useCallback(async () => {
    const [todosRes, adminsRes] = await Promise.all([
      supabase.from('admin_todos').select('*').order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, full_name, role, approved, created_at, updated_at')
        .eq('role', 'admin')
        .eq('approved', true)
        .order('full_name'),
    ])

    if (todosRes.error) {
      setError('Kunne ikke hente opgaver: ' + todosRes.error.message)
    } else if (todosRes.data) {
      const sorted = (todosRes.data as AdminTodo[]).map((todo) => ({
        ...todo,
        assigned_to: todo.assigned_to ?? null,
      })).sort(
        (a, b) =>
          ADMIN_TODO_PRIORITY_ORDER[a.priority] - ADMIN_TODO_PRIORITY_ORDER[b.priority],
      )
      setTodos(sorted)
    }

    if (adminsRes.error) {
      setError('Kunne ikke hente admins: ' + adminsRes.error.message)
    } else if (adminsRes.data) {
      setAdmins(adminsRes.data as Profile[])
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
    setAssignedTo('')
  }

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setPriority('mellem')
    setAssignedTo('')
    setFormOpen(true)
  }

  function openEdit(todo: AdminTodo) {
    setEditingId(todo.id)
    setTitle(todo.title)
    setDescription(todo.description)
    setPriority(todo.priority)
    setAssignedTo(todo.assigned_to ?? '')
    setFormOpen(true)
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to: assignedTo || null,
    }

    const result = editingId
      ? await supabase.from('admin_todos').update(payload).eq('id', editingId)
      : await supabase.from('admin_todos').insert({
          ...payload,
          created_by: user.id,
        })

    setSaving(false)
    if (result.error) {
      setError('Kunne ikke gemme opgave: ' + result.error.message)
      return
    }
    resetForm()
    await load()
  }

  async function assignTodo(todoId: string, adminId: string) {
    setAssigningId(todoId)
    setError(null)

    setTodos((current) =>
      current.map((todo) =>
        todo.id === todoId ? { ...todo, assigned_to: adminId } : todo,
      ),
    )

    const { error: updateError } = await supabase
      .from('admin_todos')
      .update({ assigned_to: adminId })
      .eq('id', todoId)

    setAssigningId(null)

    if (updateError) {
      const hint = updateError.message.includes('assigned_to')
        ? ' Database-migrationen mangler — kør 027_admin_todo_assignee.sql i Supabase.'
        : ''
      setError('Kunne ikke tildele opgave: ' + updateError.message + hint)
      await load()
      return
    }

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
    setOpenIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    await load()
  }

  function toggleTodoOpen(id: string) {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="To-do liste"
        description="Privat admin-liste — tildel opgaver til Brian eller Lasse"
        icon={ListTodo}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ny opgave
          </Button>
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

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
          <Select
            label="Ansvarlig"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Ikke tildelt endnu</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {adminDisplayName(admin)}
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
          {visible.map((todo) => {
            const assignee = todo.assigned_to ? adminById.get(todo.assigned_to) : null
            const isAssigning = assigningId === todo.id
            const isOpen = openIds.has(todo.id)

            return (
              <li key={todo.id}>
                <Card
                  className={`flex items-start gap-3 ${
                    todo.completed ? 'opacity-70' : ''
                  } ${
                    assignee && !todo.completed
                      ? 'border-2 border-green-500 bg-green-50 ring-1 ring-green-200'
                      : ''
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
                    <button
                      type="button"
                      onClick={() => toggleTodoOpen(todo.id)}
                      className="flex w-full items-start gap-2 text-left"
                      aria-expanded={isOpen}
                    >
                      <ChevronDown
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
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
                          {assignee && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
                              <User className="h-3 w-3" />
                              {adminDisplayName(assignee)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {isOpen && todo.description && (
                      <p className="mt-2 pl-6 text-sm text-gray-600 whitespace-pre-wrap">
                        {todo.description}
                      </p>
                    )}
                    {isOpen && !todo.completed && admins.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
                        <span className="text-xs font-medium text-gray-500">Tag opgaven:</span>
                        {admins.map((admin) => {
                          const selected = todo.assigned_to === admin.id
                          return (
                            <button
                              key={admin.id}
                              type="button"
                              disabled={isAssigning}
                              onClick={() => assignTodo(todo.id, admin.id)}
                              className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                selected
                                  ? 'border-green-600 bg-green-500 text-white shadow-sm'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-800'
                              }`}
                            >
                              {adminDisplayName(admin)}
                            </button>
                          )
                        })}
                      </div>
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
            )
          })}
        </ul>
      )}
    </div>
  )
}
