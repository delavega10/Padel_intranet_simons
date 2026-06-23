import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CalendarRange, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { FixedCourtCustomerCard } from '@/components/fixedcourts/FixedCourtCustomerCard'
import type { FixedCourtCustomer } from '@/types'

const emptyForm = { name: '', team: '', phone: '', email: '' }

export function FixedCourtsPage() {
  const { isAdmin } = useAuth()
  const [customers, setCustomers] = useState<FixedCourtCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fixed_court_customers')
      .select('*')
      .order('sort_order')
      .order('name')
    if (data) setCustomers(data as FixedCourtCustomer[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openModal() {
    setForm(emptyForm)
    setModalOpen(true)
  }

  async function addCustomer(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !form.name.trim()) return
    setSaving(true)
    await supabase.from('fixed_court_customers').insert({
      name: form.name.trim(),
      team: form.team.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      sort_order: customers.length,
    })
    setForm(emptyForm)
    setSaving(false)
    setModalOpen(false)
    await load()
  }

  async function deleteCustomer(id: string) {
    if (!isAdmin || !confirm('Slet kunde?')) return
    await supabase.from('fixed_court_customers').delete().eq('id', id)
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    await load()
  }

  function toggleCustomer(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpenIds(new Set(customers.map((c) => c.id)))
  }

  function collapseAll() {
    setOpenIds(new Set())
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faste baner"
        description="Kunder med faste baner: banedatoer, faktura og Matchi-bekræftelse"
        icon={CalendarRange}
      />

      {isAdmin && (
        <div className="flex justify-end">
          <Button type="button" onClick={openModal}>
            <Plus className="h-4 w-4" />
            Tilføj kunde
          </Button>
        </div>
      )}

      {customers.length === 0 ? (
        <EmptyState
          title="Ingen kunder endnu"
          description={
            isAdmin
              ? 'Tilføj den første kunde med knappen ovenfor.'
              : 'Listen er tom — kontakt admin.'
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {customers.length} kunder — klik på en kunde for at åbne
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
            {customers.map((c) => (
              <li key={c.id}>
                <FixedCourtCustomerCard
                  customer={c}
                  isAdmin={isAdmin}
                  open={openIds.has(c.id)}
                  onToggle={() => toggleCustomer(c.id)}
                  onUpdated={load}
                  onDelete={deleteCustomer}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tilføj kunde">
        <form onSubmit={addCustomer} className="space-y-4">
          <Input
            label="Navn"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Hold / firma"
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value })}
          />
          <Input
            label="Telefon"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" loading={saving}>
              <Plus className="h-4 w-4" />
              Tilføj kunde
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annuller
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
