import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'

export interface LunaCaptain {
  id: string
  name: string
  team: string | null
  phone: string | null
  email: string | null
  sort_order: number
  created_at: string
}

export function LunaLigaPage() {
  const { isAdmin } = useAuth()
  const [captains, setCaptains] = useState<LunaCaptain[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('luna_captains')
      .select('*')
      .order('sort_order')
      .order('name')
    if (data) setCaptains(data as LunaCaptain[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addCaptain(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !name.trim()) return
    setSaving(true)
    await supabase.from('luna_captains').insert({
      name: name.trim(),
      team: team.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      sort_order: captains.length,
    })
    setName('')
    setTeam('')
    setPhone('')
    setEmail('')
    setSaving(false)
    await load()
  }

  async function deleteCaptain(id: string) {
    if (!isAdmin || !confirm('Slet kaptajn?')) return
    await supabase.from('luna_captains').delete().eq('id', id)
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="LunaLiga oversigt"
        description="Liste over Luna-kaptajner"
        icon={Trophy}
      />

      {isAdmin && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 normal-case">Tilføj kaptajn</h3>
          <form onSubmit={addCaptain} className="grid gap-3 sm:grid-cols-2">
            <Input label="Navn" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Hold" value={team} onChange={(e) => setTeam(e.target.value)} />
            <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                <Plus className="h-4 w-4" />
                Tilføj
              </Button>
            </div>
          </form>
        </Card>
      )}

      {captains.length === 0 ? (
        <EmptyState
          title="Ingen kaptajner endnu"
          description={
            isAdmin
              ? 'Tilføj den første kaptajn ovenfor.'
              : 'Listen er tom — kontakt admin.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {captains.map((c) => (
            <li key={c.id}>
              <Card className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  {c.team && <p className="text-sm text-padel-700 mt-0.5">{c.team}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-padel-600 hover:underline">
                        {c.email}
                      </a>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deleteCaptain(c.id)}
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
