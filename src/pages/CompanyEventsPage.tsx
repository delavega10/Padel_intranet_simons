import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CompanyEventCard } from '@/components/company-events/CompanyEventCard'
import {
  COMPANY_EVENT_STATUS_LABELS,
  type CompanyEvent,
  type CompanyEventFinance,
  type CompanyEventStatus,
  type CompanyEventSupplier,
  type CompanyEventSupplierFinance,
  type CompanyEventTodo,
  type CompanyEventMarketing,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type CompanyEventSupplierAddon,
} from '@/types'

const emptyForm = {
  title: '',
  event_date: new Date().toISOString().slice(0, 10),
  event_time: '',
  description: '',
  status: 'planlaegning' as CompanyEventStatus,
  host_company: '',
  host_contact_name: '',
  host_contact_phone: '',
  host_contact_email: '',
  public_notes: '',
  whole_hall: false,
  court_count: '',
}

export function CompanyEventsPage() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState<CompanyEvent[]>([])
  const [suppliers, setSuppliers] = useState<CompanyEventSupplier[]>([])
  const [todos, setTodos] = useState<CompanyEventTodo[]>([])
  const [financeByEvent, setFinanceByEvent] = useState<Record<string, CompanyEventFinance>>({})
  const [supplierFinance, setSupplierFinance] = useState<Record<string, CompanyEventSupplierFinance>>({})
  const [supplierAddons, setSupplierAddons] = useState<Record<string, CompanyEventSupplierAddon[]>>({})
  const [marketingByEvent, setMarketingByEvent] = useState<Record<string, CompanyEventMarketing>>({})
  const [marketingItems, setMarketingItems] = useState<CompanyEventMarketingItem[]>([])
  const [marketingItemFinance, setMarketingItemFinance] = useState<
    Record<string, CompanyEventMarketingItemFinance>
  >({})
  const [marketingItemAddons, setMarketingItemAddons] = useState<
    Record<string, CompanyEventMarketingItemAddon[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const results = await Promise.all([
      supabase.from('company_events').select('*').order('event_date', { ascending: true }),
      supabase.from('company_event_suppliers').select('*').order('sort_order'),
      supabase.from('company_event_todos').select('*').order('sort_order'),
      supabase.from('company_event_marketing').select('*'),
      supabase.from('company_event_marketing_items').select('*').order('sort_order'),
      ...(isAdmin
        ? [
            supabase.from('company_event_finance').select('*'),
            supabase.from('company_event_supplier_finance').select('*'),
            supabase.from('company_event_supplier_addons').select('*').order('sort_order'),
            supabase.from('company_event_marketing_item_finance').select('*'),
            supabase.from('company_event_marketing_item_addons').select('*').order('sort_order'),
          ]
        : []),
    ])

    if (results[0].data) setEvents(results[0].data as CompanyEvent[])
    if (results[1].data) setSuppliers(results[1].data as CompanyEventSupplier[])
    if (results[2].data) setTodos(results[2].data as CompanyEventTodo[])

    if (results[3].data) {
      const mMap: Record<string, CompanyEventMarketing> = {}
      for (const m of results[3].data as CompanyEventMarketing[]) mMap[m.event_id] = m
      setMarketingByEvent(mMap)
    }
    if (results[4].data) setMarketingItems(results[4].data as CompanyEventMarketingItem[])

    if (isAdmin && results[5]?.data) {
      const finMap: Record<string, CompanyEventFinance> = {}
      for (const f of results[5].data as CompanyEventFinance[]) finMap[f.event_id] = f
      setFinanceByEvent(finMap)
    }

    if (isAdmin && results[6]?.data) {
      const sfMap: Record<string, CompanyEventSupplierFinance> = {}
      for (const f of results[6].data as CompanyEventSupplierFinance[]) sfMap[f.supplier_id] = f
      setSupplierFinance(sfMap)
    }

    if (isAdmin && results[7]?.data) {
      const saMap: Record<string, CompanyEventSupplierAddon[]> = {}
      for (const a of results[7].data as CompanyEventSupplierAddon[]) {
        const list = saMap[a.supplier_id] ?? []
        list.push(a)
        saMap[a.supplier_id] = list
      }
      setSupplierAddons(saMap)
    } else {
      setSupplierAddons({})
    }

    if (isAdmin && results[8]?.data) {
      const mfMap: Record<string, CompanyEventMarketingItemFinance> = {}
      for (const f of results[8].data as CompanyEventMarketingItemFinance[]) mfMap[f.item_id] = f
      setMarketingItemFinance(mfMap)
    }

    if (isAdmin && results[9]?.data) {
      const maMap: Record<string, CompanyEventMarketingItemAddon[]> = {}
      for (const a of results[9].data as CompanyEventMarketingItemAddon[]) {
        const list = maMap[a.item_id] ?? []
        list.push(a)
        maMap[a.item_id] = list
      }
      setMarketingItemAddons(maMap)
    } else {
      setMarketingItemAddons({})
    }

    setLoading(false)
  }, [isAdmin])

  useEffect(() => {
    load()
  }, [load])

  const suppliersByEvent = useMemo(() => {
    const map = new Map<string, CompanyEventSupplier[]>()
    for (const s of suppliers) {
      const list = map.get(s.event_id) ?? []
      list.push(s)
      map.set(s.event_id, list)
    }
    return map
  }, [suppliers])

  const todosByEvent = useMemo(() => {
    const map = new Map<string, CompanyEventTodo[]>()
    for (const t of todos) {
      const list = map.get(t.event_id) ?? []
      list.push(t)
      map.set(t.event_id, list)
    }
    return map
  }, [todos])

  const marketingItemsByEvent = useMemo(() => {
    const map = new Map<string, CompanyEventMarketingItem[]>()
    for (const item of marketingItems) {
      const list = map.get(item.event_id) ?? []
      list.push(item)
      map.set(item.event_id, list)
    }
    return map
  }, [marketingItems])

  function resetForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(event: CompanyEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time?.slice(0, 5) ?? '',
      description: event.description ?? '',
      status: event.status,
      host_company: event.host_company ?? '',
      host_contact_name: event.host_contact_name ?? '',
      host_contact_phone: event.host_contact_phone ?? '',
      host_contact_email: event.host_contact_email ?? '',
      public_notes: event.public_notes ?? '',
      whole_hall: event.whole_hall,
      court_count: event.court_count ? String(event.court_count) : '',
    })
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !form.title.trim() || !form.event_date) return
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      event_date: form.event_date,
      event_time: form.event_time || null,
      description: form.description.trim() || null,
      status: form.status,
      host_company: form.host_company.trim() || null,
      host_contact_name: form.host_contact_name.trim() || null,
      host_contact_phone: form.host_contact_phone.trim() || null,
      host_contact_email: form.host_contact_email.trim() || null,
      public_notes: form.public_notes.trim() || null,
      whole_hall: form.whole_hall,
      court_count: form.whole_hall ? null : parseInt(form.court_count, 10) || null,
    }

    if (editingId) {
      await supabase.from('company_events').update(payload).eq('id', editingId)
    } else {
      const { data } = await supabase
        .from('company_events')
        .insert({ ...payload, created_by: user?.id ?? null })
        .select('id')
        .single()
      if (data) {
        await Promise.all([
          supabase.from('company_event_finance').insert({ event_id: data.id }),
          supabase.from('company_event_marketing').insert({ event_id: data.id }),
        ])
      }
    }

    setSaving(false)
    resetForm()
    await load()
  }

  async function deleteEvent(id: string) {
    if (!isAdmin || !confirm('Slet event og alt tilknyttet indhold?')) return
    await supabase.from('company_events').delete().eq('id', id)
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    await load()
  }

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <LoadingSpinner />

  const upcoming = events.filter((e) => e.status !== 'afholdt' && e.status !== 'aflyst')
  const past = events.filter((e) => e.status === 'afholdt' || e.status === 'aflyst')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firma events"
        description="Koordinér events — marketing-tilbehør, kontakter, leverandører, opgaver og økonomi"
        icon={Building2}
        action={
          isAdmin ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Opret event
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <Modal
          open={formOpen}
          onClose={resetForm}
          title={editingId ? 'Rediger event' : 'Opret event'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <Input label="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Dato" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
              <Input label="Tidspunkt" type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
            </div>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CompanyEventStatus })}>
              {(Object.keys(COMPANY_EVENT_STATUS_LABELS) as CompanyEventStatus[]).map((s) => (
                <option key={s} value={s}>{COMPANY_EVENT_STATUS_LABELS[s]}</option>
              ))}
            </Select>
            <Textarea label="Beskrivelse" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Baner</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="courts"
                    checked={form.whole_hall}
                    onChange={() => setForm({ ...form, whole_hall: true, court_count: '' })}
                    className="border-gray-300 text-padel-600"
                  />
                  Hele hallen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="courts"
                    checked={!form.whole_hall}
                    onChange={() => setForm({ ...form, whole_hall: false })}
                    className="border-gray-300 text-padel-600"
                  />
                  Antal baner
                </label>
                {!form.whole_hall && (
                  <Input
                    label="Antal baner"
                    type="number"
                    min={1}
                    max={13}
                    value={form.court_count}
                    onChange={(e) => setForm({ ...form, court_count: e.target.value })}
                    placeholder="Fx 4"
                  />
                )}
              </div>
            </div>
            <hr className="border-gray-100" />
            <p className="text-sm font-medium text-gray-700">Firma / vært</p>
            <Input label="Firmanavn" value={form.host_company} onChange={(e) => setForm({ ...form, host_company: e.target.value })} />
            <Input label="Kontaktperson" value={form.host_contact_name} onChange={(e) => setForm({ ...form, host_contact_name: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Telefon" type="tel" value={form.host_contact_phone} onChange={(e) => setForm({ ...form, host_contact_phone: e.target.value })} />
              <Input label="E-mail" type="email" value={form.host_contact_email} onChange={(e) => setForm({ ...form, host_contact_email: e.target.value })} />
            </div>
            <Textarea
              label="Noter til medarbejdere"
              value={form.public_notes}
              onChange={(e) => setForm({ ...form, public_notes: e.target.value })}
              placeholder="Hvad skal personalet vide og forberede?"
              rows={3}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" loading={saving}>{editingId ? 'Gem' : 'Opret event'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Annuller</Button>
            </div>
          </form>
        </Modal>
      )}

      {events.length === 0 ? (
        <EmptyState
          title="Ingen firma events endnu"
          description={isAdmin ? 'Klik «Opret event» for at komme i gang.' : 'Der er ingen planlagte events endnu.'}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Kommende</h2>
              {upcoming.map((event) => (
                <CompanyEventCard
                  key={event.id}
                  event={event}
                  suppliers={suppliersByEvent.get(event.id) ?? []}
                  todos={todosByEvent.get(event.id) ?? []}
                  marketing={marketingByEvent[event.id] ?? null}
                  marketingItems={marketingItemsByEvent.get(event.id) ?? []}
                  marketingItemFinance={marketingItemFinance}
                  finance={financeByEvent[event.id] ?? null}
                  supplierFinance={supplierFinance}
                  supplierAddons={supplierAddons}
                  marketingItemAddons={marketingItemAddons}
                  isAdmin={isAdmin}
                  open={openIds.has(event.id)}
                  onToggle={() => toggleOpen(event.id)}
                  onUpdated={load}
                  onDelete={deleteEvent}
                  onEdit={openEdit}
                />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Afholdt / aflyst</h2>
              {past.map((event) => (
                <CompanyEventCard
                  key={event.id}
                  event={event}
                  suppliers={suppliersByEvent.get(event.id) ?? []}
                  todos={todosByEvent.get(event.id) ?? []}
                  marketing={marketingByEvent[event.id] ?? null}
                  marketingItems={marketingItemsByEvent.get(event.id) ?? []}
                  marketingItemFinance={marketingItemFinance}
                  finance={financeByEvent[event.id] ?? null}
                  supplierFinance={supplierFinance}
                  supplierAddons={supplierAddons}
                  marketingItemAddons={marketingItemAddons}
                  isAdmin={isAdmin}
                  open={openIds.has(event.id)}
                  onToggle={() => toggleOpen(event.id)}
                  onUpdated={load}
                  onDelete={deleteEvent}
                  onEdit={openEdit}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
