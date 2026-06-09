import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createUserAsAdmin } from '@/lib/createUser'
import { deleteUserAsAdmin, updateUserAsAdmin } from '@/lib/manageUser'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ROLE_LABELS, type Profile, type UserRole } from '@/types'

interface EditForm {
  full_name: string
  email: string
  role: UserRole
  approved: boolean
  password: string
}

export function AdminUsersTab() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('medarbejder')
  const [approved, setApproved] = useState(true)

  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '',
    email: '',
    role: 'medarbejder',
    approved: true,
    password: '',
  })

  async function load() {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (loadError) {
      setError('Kunne ikke hente brugere: ' + loadError.message)
    } else if (data) {
      setUsers(data as Profile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateUserQuick(
    id: string,
    updates: Partial<Pick<Profile, 'role' | 'approved'>>,
  ) {
    const { error: updateError } = await updateUserAsAdmin({ id, ...updates })
    if (updateError) {
      setError(updateError)
      return
    }
    setError(null)
    await load()
  }

  function openEdit(u: Profile) {
    setEditUser(u)
    setEditForm({
      full_name: u.full_name ?? '',
      email: u.email,
      role: u.role,
      approved: u.approved,
      password: '',
    })
    setError(null)
  }

  function closeEdit() {
    setEditUser(null)
    setEditForm({
      full_name: '',
      email: '',
      role: 'medarbejder',
      approved: true,
      password: '',
    })
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return

    setSaving(true)
    setError(null)

    const { error: saveError } = await updateUserAsAdmin({
      id: editUser.id,
      full_name: editForm.full_name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      approved: editForm.approved,
      ...(editForm.password ? { password: editForm.password } : {}),
    })

    setSaving(false)

    if (saveError) {
      setError(saveError)
      return
    }

    setMessage(`Bruger opdateret: ${editForm.email.trim()}`)
    closeEdit()
    await load()
  }

  async function handleDelete(u: Profile) {
    const label = u.full_name ?? u.email
    if (
      !confirm(
        `Slet brugeren «${label}»?\n\nDette kan ikke fortrydes. Brugeren mister adgang med det samme.`,
      )
    ) {
      return
    }

    setDeletingId(u.id)
    setError(null)
    setMessage(null)

    const { error: deleteError } = await deleteUserAsAdmin(u.id)

    setDeletingId(null)

    if (deleteError) {
      setError(deleteError)
      return
    }

    setMessage(`Bruger slettet: ${label}`)
    await load()
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setMessage(null)
    setError(null)

    const { error: createError } = await createUserAsAdmin({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      role,
      approved,
    })

    setCreating(false)

    if (createError) {
      setError(createError)
      return
    }

    setMessage(`Bruger oprettet: ${email.trim()}`)
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('medarbejder')
    setApproved(true)
    await load()
  }

  if (loading) return <p className="text-gray-500">Indlæser brugere...</p>

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4 normal-case flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-padel-600" />
          Opret ny bruger
        </h3>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Adgangskode (min. 6 tegn)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Fulde navn"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Select
            label="Rolle"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="rounded border-gray-300 text-padel-600"
            />
            <span className="text-gray-700">Godkendt med det samme (kan logge ind)</span>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={creating}>
              Opret bruger
            </Button>
          </div>
        </form>
        {message && (
          <p className="mt-3 text-sm text-padel-700 bg-padel-50 rounded-lg px-3 py-2">{message}</p>
        )}
        {error && !editUser && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 normal-case">Alle brugere</h3>
        {users.map((u) => {
          const isSelf = u.id === currentUser?.id
          return (
            <Card key={u.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{u.full_name ?? u.email}</CardTitle>
                  <p className="text-sm text-gray-500">{u.email}</p>
                  {isSelf && <p className="text-xs text-padel-600 mt-1">Det er dig</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={u.approved}
                      onChange={(e) => updateUserQuick(u.id, { approved: e.target.checked })}
                      className="rounded border-gray-300 text-padel-600"
                    />
                    <span className="text-gray-700">Godkendt</span>
                  </label>
                  <div className="w-40">
                    <Select
                      value={u.role}
                      onChange={(e) =>
                        updateUserQuick(u.id, { role: e.target.value as UserRole })
                      }
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-2"
                    onClick={() => openEdit(u)}
                    aria-label={`Rediger ${u.full_name ?? u.email}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="!px-3 !py-2"
                    onClick={() => handleDelete(u)}
                    disabled={isSelf || deletingId === u.id}
                    loading={deletingId === u.id}
                    aria-label={`Slet ${u.full_name ?? u.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={editUser !== null}
        onClose={closeEdit}
        title={editUser ? `Rediger ${editUser.full_name ?? editUser.email}` : 'Rediger bruger'}
      >
        <form onSubmit={handleEditSave} className="space-y-4">
          <Input
            label="Fulde navn"
            value={editForm.full_name}
            onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Select
            label="Rolle"
            value={editForm.role}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))
            }
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Input
            label="Ny adgangskode (valgfrit)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
            minLength={6}
            placeholder="Lad stå tom for at beholde nuværende"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editForm.approved}
              onChange={(e) => setEditForm((f) => ({ ...f, approved: e.target.checked }))}
              className="rounded border-gray-300 text-padel-600"
            />
            <span className="text-gray-700">Godkendt (kan logge ind)</span>
          </label>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Annuller
            </Button>
            <Button type="submit" loading={saving}>
              Gem ændringer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
