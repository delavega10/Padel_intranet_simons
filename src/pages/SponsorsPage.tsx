import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Handshake, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/format'
import type { Sponsor } from '@/types'

function expiryStatus(expiresAt: string): 'ok' | 'soon' | 'expired' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(`${expiresAt}T12:00:00`)
  if (exp < today) return 'expired'
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 30)
  if (exp <= in30) return 'soon'
  return 'ok'
}

const expiryLabel: Record<ReturnType<typeof expiryStatus>, string> = {
  ok: 'Aktiv',
  soon: 'Udløber snart',
  expired: 'Udløbet',
}

const expiryClass: Record<ReturnType<typeof expiryStatus>, string> = {
  ok: 'bg-green-100 text-green-800',
  soon: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
}

export function SponsorsPage() {
  const { isAdmin } = useAuth()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('sort_order')
      .order('name')
    if (data) setSponsors(data as Sponsor[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function resetForm() {
    setFormOpen(false)
    setEditingId(null)
    setName('')
    setLogoUrl('')
    setWebsiteUrl('')
    setExpiresAt('')
  }

  function openCreate() {
    setEditingId(null)
    setName('')
    setLogoUrl('')
    setWebsiteUrl('')
    setExpiresAt('')
    setFormOpen(true)
  }

  function startEdit(s: Sponsor) {
    setEditingId(s.id)
    setName(s.name)
    setLogoUrl(s.logo_url)
    setWebsiteUrl(s.website_url ?? '')
    setExpiresAt(s.expires_at)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !name.trim() || !logoUrl.trim() || !expiresAt) return
    setSaving(true)

    const payload = {
      name: name.trim(),
      logo_url: logoUrl.trim(),
      website_url: websiteUrl.trim() || null,
      expires_at: expiresAt,
    }

    if (editingId) {
      await supabase.from('sponsors').update(payload).eq('id', editingId)
    } else {
      await supabase.from('sponsors').insert({
        ...payload,
        sort_order: sponsors.length,
      })
    }

    setSaving(false)
    resetForm()
    await load()
  }

  async function deleteSponsor(id: string) {
    if (!isAdmin || !confirm('Slet sponsor?')) return
    await supabase.from('sponsors').delete().eq('id', id)
    if (editingId === id) resetForm()
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsorer"
        description="Overblik over sponsorer, logo og hvornår sponsoratet udløber"
        icon={Handshake}
        action={
          isAdmin ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tilføj sponsor
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <Modal
          open={formOpen}
          onClose={resetForm}
          title={editingId ? 'Rediger sponsor' : 'Tilføj sponsor'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Navn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sponsornavn"
              required
            />
            <Input
              label="Logo-URL"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              required
            />
            <Input
              label="Hjemmeside (valgfrit)"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Sponsorat udløber"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
            {logoUrl.trim() && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-center min-h-[80px]">
                <img
                  src={logoUrl.trim()}
                  alt="Logo forhåndsvisning"
                  className="max-h-16 max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" loading={saving}>
                {editingId ? 'Gem ændringer' : 'Tilføj sponsor'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Annuller
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {sponsors.length === 0 ? (
        <EmptyState
          title="Ingen sponsorer endnu"
          description={
            isAdmin
              ? 'Klik «Tilføj sponsor» for at oprette den første.'
              : 'Listen er tom — kontakt admin.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => {
            const status = expiryStatus(s.expires_at)
            return (
              <Card key={s.id} className="flex flex-col">
                <div className="flex h-28 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 mb-4 p-4">
                  <img
                    src={s.logo_url}
                    alt={s.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Udløber {formatDate(s.expires_at)}
                    </p>
                    <span
                      className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs font-medium ${expiryClass[status]}`}
                    >
                      {expiryLabel[status]}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded p-2 text-gray-400 hover:text-padel-700 hover:bg-gray-100"
                        aria-label="Rediger"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSponsor(s.id)}
                        className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="Slet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {s.website_url && (
                  <a
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-padel-600 hover:underline"
                  >
                    Besøg hjemmeside
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
