import { useCallback, useEffect, useState } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { LunaCaptainCard } from '@/components/luna/LunaCaptainCard'
import type { LunaCaptain } from '@/types'

export function LunaLigaPage() {
  const { isAdmin } = useAuth()
  const [captains, setCaptains] = useState<LunaCaptain[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
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
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    await load()
  }

  function toggleCaptain(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpenIds(new Set(captains.map((c) => c.id)))
  }

  function collapseAll() {
    setOpenIds(new Set())
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="LunaLiga oversigt"
        description="Kaptajner, banedatoer, faktura og Matchi-bekræftelse"
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
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {captains.length} hold — klik på et hold for at åbne
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-padel-700 hover:bg-padel-50"
              >
                Åbn alle
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Luk alle
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {captains.map((c) => (
              <li key={c.id}>
                <LunaCaptainCard
                  captain={c}
                  isAdmin={isAdmin}
                  open={openIds.has(c.id)}
                  onToggle={() => toggleCaptain(c.id)}
                  onUpdated={load}
                  onDelete={deleteCaptain}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
