import { useEffect, useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createUserAsAdmin } from '@/lib/createUser'
import { Card, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ROLE_LABELS, type Profile, type UserRole } from '@/types'

export function AdminUsersTab() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('medarbejder')
  const [approved, setApproved] = useState(true)

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

  async function updateUser(id: string, updates: Partial<Pick<Profile, 'role' | 'approved'>>) {
    const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setError(null)
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
        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 normal-case">Alle brugere</h3>
        {users.map((u) => (
          <Card key={u.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{u.full_name ?? u.email}</CardTitle>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={u.approved}
                    onChange={(e) => updateUser(u.id, { approved: e.target.checked })}
                    className="rounded border-gray-300 text-padel-600"
                  />
                  <span className="text-gray-700">Godkendt</span>
                </label>
                <div className="w-40">
                  <Select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value as UserRole })}
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
