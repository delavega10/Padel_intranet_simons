import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ROLE_LABELS, type Profile, type UserRole } from '@/types'

export function AdminUsersTab() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data as Profile[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateUser(id: string, updates: Partial<Pick<Profile, 'role' | 'approved'>>) {
    await supabase.from('profiles').update(updates).eq('id', id)
    await load()
  }

  if (loading) return <p className="text-gray-500">Indlæser brugere...</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Nye brugere oprettes via Supabase Auth. Godkend brugere og tildel roller her.
      </p>
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
                <span className="text-gray-300">Godkendt</span>
              </label>
              <div className="w-40">
                <Select
                  value={u.role}
                  onChange={(e) => updateUser(u.id, { role: e.target.value as UserRole })}
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
