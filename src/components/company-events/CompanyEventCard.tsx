import { useState, type FormEvent } from 'react'
import {
  ChevronDown,
  Check,
  Mail,
  Phone,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EventCourtBooking } from '@/components/company-events/EventCourtBooking'
import { EventDashboardTab } from '@/components/company-events/EventDashboardTab'
import { EventEconomyTab } from '@/components/company-events/EventEconomyTab'
import { AddonListEditor } from '@/components/company-events/AddonListEditor'
import { EventMarketingSection } from '@/components/company-events/EventMarketingSection'
import { supplierLineTotal } from '@/lib/eventEconomyTotals'
import {
  addonDraftsFromRecords,
  emptyAddonDraft,
  replaceSupplierAddons,
  type AddonDraft,
} from '@/lib/financeAddons'
import { formatCurrency, formatDate, formatEventCourts, formatTime } from '@/lib/format'
import {
  COMPANY_EVENT_STATUS_LABELS,
  EVENT_SUPPLIER_CATEGORY_LABELS,
  type CompanyEvent,
  type CompanyEventFinance,
  type CompanyEventMarketing,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type CompanyEventSupplier,
  type CompanyEventSupplierAddon,
  type CompanyEventSupplierFinance,
  type CompanyEventTodo,
  type EventSupplierCategory,
} from '@/types'

const statusClass: Record<CompanyEvent['status'], string> = {
  planlaegning: 'bg-blue-100 text-blue-800',
  bekraeftet: 'bg-green-100 text-green-800',
  afholdt: 'bg-gray-100 text-gray-700',
  aflyst: 'bg-red-100 text-red-800',
}

const supplierCategories = Object.keys(EVENT_SUPPLIER_CATEGORY_LABELS) as EventSupplierCategory[]

type EventTab = 'dashboard' | 'info' | 'baner' | 'leverandorer' | 'opgaver' | 'marketing' | 'okonomi'

interface CompanyEventCardProps {
  event: CompanyEvent
  suppliers: CompanyEventSupplier[]
  todos: CompanyEventTodo[]
  marketing: CompanyEventMarketing | null
  marketingItems: CompanyEventMarketingItem[]
  marketingItemFinance: Record<string, CompanyEventMarketingItemFinance>
  finance: CompanyEventFinance | null
  supplierFinance: Record<string, CompanyEventSupplierFinance>
  supplierAddons: Record<string, CompanyEventSupplierAddon[]>
  marketingItemAddons: Record<string, CompanyEventMarketingItemAddon[]>
  isAdmin: boolean
  open: boolean
  onToggle: () => void
  onUpdated: () => void
  onDelete: (id: string) => void
  onEdit: (event: CompanyEvent) => void
}

export function CompanyEventCard({
  event,
  suppliers,
  todos,
  marketing,
  marketingItems,
  marketingItemFinance,
  finance,
  supplierFinance,
  supplierAddons,
  marketingItemAddons,
  isAdmin,
  open,
  onToggle,
  onUpdated,
  onDelete,
  onEdit,
}: CompanyEventCardProps) {
  const [activeTab, setActiveTab] = useState<EventTab>('dashboard')
  const [supplierModal, setSupplierModal] = useState(false)
  const [todoModal, setTodoModal] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [supCategory, setSupCategory] = useState<EventSupplierCategory>('mad')
  const [supName, setSupName] = useState('')
  const [supContact, setSupContact] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supEmail, setSupEmail] = useState('')
  const [supDesc, setSupDesc] = useState('')
  const [supNotes, setSupNotes] = useState('')
  const [supPrice, setSupPrice] = useState('')
  const [supOnFrom, setSupOnFrom] = useState('')
  const [supOnTo, setSupOnTo] = useState('')
  const [supIncluded, setSupIncluded] = useState('')
  const [supAddons, setSupAddons] = useState<AddonDraft[]>([emptyAddonDraft()])

  const [todoTitle, setTodoTitle] = useState('')
  const [todoDesc, setTodoDesc] = useState('')
  const [todoDue, setTodoDue] = useState('')

  function supplierAddonsToDrafts(supplierId: string, finance?: CompanyEventSupplierFinance): AddonDraft[] {
    const fromDb = supplierAddons[supplierId]
    if (fromDb?.length) return addonDraftsFromRecords(fromDb)
    if (finance?.addon_description || finance?.addon_price != null) {
      return [{ description: finance.addon_description ?? '', price: finance.addon_price?.toString() ?? '' }]
    }
    return [emptyAddonDraft()]
  }

  function resetSupplierForm() {
    setEditingSupplierId(null)
    setSupCategory('mad')
    setSupName('')
    setSupContact('')
    setSupPhone('')
    setSupEmail('')
    setSupDesc('')
    setSupNotes('')
    setSupPrice('')
    setSupOnFrom('')
    setSupOnTo('')
    setSupIncluded('')
    setSupAddons([emptyAddonDraft()])
  }

  function openAddSupplier() {
    resetSupplierForm()
    setSupplierModal(true)
  }

  function openEditSupplier(s: CompanyEventSupplier) {
    const finance = supplierFinance[s.id]
    setEditingSupplierId(s.id)
    setSupCategory(s.category)
    setSupName(s.name)
    setSupContact(s.contact_name ?? '')
    setSupPhone(s.phone ?? '')
    setSupEmail(s.email ?? '')
    setSupDesc(s.description ?? '')
    setSupNotes(s.notes ?? '')
    setSupPrice(finance?.agreed_price?.toString() ?? '')
    setSupOnFrom(finance?.on_site_from?.slice(0, 5) ?? '')
    setSupOnTo(finance?.on_site_to?.slice(0, 5) ?? '')
    setSupIncluded(finance?.included_description ?? '')
    setSupAddons(supplierAddonsToDrafts(s.id, finance))
    setSupplierModal(true)
  }

  async function saveSupplierFinance(supplierId: string) {
    await supabase.from('company_event_supplier_finance').upsert({
      supplier_id: supplierId,
      agreed_price: supPrice ? parseFloat(supPrice) : null,
      on_site_from: supOnFrom || null,
      on_site_to: supOnTo || null,
      included_description: supIncluded.trim() || null,
    })
    await replaceSupplierAddons(supplierId, supAddons)
  }

  async function handleSupplierSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !supName.trim()) return
    setSaving(true)
    const payload = {
      category: supCategory,
      name: supName.trim(),
      contact_name: supContact.trim() || null,
      phone: supPhone.trim() || null,
      email: supEmail.trim() || null,
      description: supDesc.trim() || null,
      notes: supNotes.trim() || null,
    }

    let supplierId = editingSupplierId
    if (editingSupplierId) {
      await supabase.from('company_event_suppliers').update(payload).eq('id', editingSupplierId)
    } else {
      const { data } = await supabase
        .from('company_event_suppliers')
        .insert({ ...payload, event_id: event.id, sort_order: suppliers.length })
        .select('id')
        .single()
      if (data) {
        supplierId = data.id
        await supabase.from('company_event_supplier_finance').insert({ supplier_id: data.id })
      }
    }
    if (supplierId) await saveSupplierFinance(supplierId)

    setSaving(false)
    setSupplierModal(false)
    resetSupplierForm()
    onUpdated()
  }

  function resetTodoForm() {
    setEditingTodoId(null)
    setTodoTitle('')
    setTodoDesc('')
    setTodoDue('')
  }

  function openAddTodo() {
    resetTodoForm()
    setTodoModal(true)
  }

  function openEditTodo(todo: CompanyEventTodo) {
    setEditingTodoId(todo.id)
    setTodoTitle(todo.title)
    setTodoDesc(todo.description ?? '')
    setTodoDue(todo.due_date ?? '')
    setTodoModal(true)
  }

  async function handleTodoSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !todoTitle.trim()) return
    setSaving(true)
    const payload = {
      title: todoTitle.trim(),
      description: todoDesc.trim() || null,
      due_date: todoDue || null,
    }

    if (editingTodoId) {
      await supabase.from('company_event_todos').update(payload).eq('id', editingTodoId)
    } else {
      await supabase.from('company_event_todos').insert({
        ...payload,
        event_id: event.id,
        sort_order: todos.length,
      })
    }

    setSaving(false)
    setTodoModal(false)
    resetTodoForm()
    onUpdated()
  }

  async function toggleTodo(todo: CompanyEventTodo) {
    await supabase
      .from('company_event_todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)
    onUpdated()
  }

  async function deleteTodo(id: string) {
    if (!isAdmin || !confirm('Slet opgave?')) return
    await supabase.from('company_event_todos').delete().eq('id', id)
    onUpdated()
  }

  async function deleteSupplier(id: string) {
    if (!isAdmin || !confirm('Slet leverandør?')) return
    await supabase.from('company_event_suppliers').delete().eq('id', id)
    onUpdated()
  }

  const openTodos = todos.filter((t) => !t.completed).length
  const marketingCount = marketingItems.filter((i) => i.status !== 'annulleret').length
  const courtsLabel = formatEventCourts(event.whole_hall, event.court_count)

  const tabs: { id: EventTab; label: string; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'info', label: 'Info & kontakt' },
    { id: 'baner', label: 'Baner' },
    { id: 'leverandorer', label: 'Leverandører', badge: suppliers.length || undefined },
    { id: 'opgaver', label: 'Opgaver', badge: openTodos || undefined },
    { id: 'marketing', label: 'Marketing', badge: marketingCount || undefined },
    { id: 'okonomi', label: 'Økonomi', adminOnly: true },
  ]

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin)

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
        onClick={onToggle}
      >
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{event.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[event.status]}`}>
              {COMPANY_EVENT_STATUS_LABELS[event.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(event.event_date)}
            {event.event_time && ` kl. ${formatTime(event.event_time)}`}
            {event.host_company && ` · ${event.host_company}`}
            {courtsLabel && ` · ${courtsLabel}`}
            {event.matchi_booked && ' · Matchi ✓'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 justify-end">
          {marketingCount > 0 && (
            <span className="rounded-full bg-padel-100 px-2 py-0.5 text-xs font-medium text-padel-800">
              {marketingCount} marketing
            </span>
          )}
          {openTodos > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {openTodos} opgave{openTodos === 1 ? '' : 'r'}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4">
          {isAdmin && (
            <div className="flex flex-wrap gap-2 pt-4 pb-2">
              <Button type="button" variant="secondary" onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4" />
                Rediger event
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setActiveTab('leverandorer'); openAddSupplier() }}>
                <Plus className="h-4 w-4" />
                Leverandør
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setActiveTab('opgaver'); openAddTodo() }}>
                <Plus className="h-4 w-4" />
                Opgave
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(event.id)}>
                <Trash2 className="h-4 w-4" />
                Slet
              </Button>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px -mx-1 px-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-padel-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-padel-700'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {activeTab === 'dashboard' && (
              <EventDashboardTab
                event={event}
                marketing={marketing}
                marketingItems={marketingItems}
                suppliers={suppliers}
                supplierFinance={supplierFinance}
                supplierAddons={supplierAddons}
                marketingItemFinance={marketingItemFinance}
                marketingItemAddons={marketingItemAddons}
                todos={todos}
                supplierCount={suppliers.length}
                isAdmin={isAdmin}
                onEdit={() => onEdit(event)}
              />
            )}

            {activeTab === 'info' && (
              <div className="space-y-5">
                {isAdmin && (
                  <Button type="button" variant="secondary" onClick={() => onEdit(event)}>
                    <Pencil className="h-4 w-4" />
                    Rediger info & kontakt
                  </Button>
                )}
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Om eventet</h3>
                  <p className="text-sm text-gray-500">Simons Padel Club, Humlebæk</p>
                  {courtsLabel && <p className="text-sm font-medium text-padel-700 mt-2">{courtsLabel}</p>}
                  {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                  {event.public_notes && (
                    <p className="text-sm text-gray-700 mt-3 rounded-lg bg-padel-50 px-3 py-2">{event.public_notes}</p>
                  )}
                </section>
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Firma / vært</h3>
                  {event.host_company || event.host_contact_name ? (
                    <>
                      {event.host_company && <p className="font-medium text-gray-900">{event.host_company}</p>}
                      {event.host_contact_name && <p className="text-sm text-gray-600 mt-0.5">{event.host_contact_name}</p>}
                      <div className="mt-2 space-y-1">
                        {event.host_contact_phone && (
                          <a href={`tel:${event.host_contact_phone}`} className="flex items-center gap-2 text-sm text-padel-600 hover:underline">
                            <Phone className="h-3.5 w-3.5" /> {event.host_contact_phone}
                          </a>
                        )}
                        {event.host_contact_email && (
                          <a href={`mailto:${event.host_contact_email}`} className="flex items-center gap-2 text-sm text-padel-600 hover:underline break-all">
                            <Mail className="h-3.5 w-3.5" /> {event.host_contact_email}
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Ingen kontaktinfo endnu.</p>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'baner' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {courtsLabel ? (
                    <p className="text-sm text-gray-600">
                      Aftalt behov: <span className="font-medium text-padel-700">{courtsLabel}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Antal baner ikke angivet endnu.</p>
                  )}
                  {isAdmin && (
                    <Button type="button" variant="secondary" className="text-sm" onClick={() => onEdit(event)}>
                      <Pencil className="h-4 w-4" />
                      Rediger baner-aftale
                    </Button>
                  )}
                </div>
                <EventCourtBooking event={event} isAdmin={isAdmin} onUpdated={onUpdated} />
              </div>
            )}

            {activeTab === 'leverandorer' && (
              <section>
                <p className="text-xs text-gray-500 mb-3">Priser og tilkøb indtastes ved oprettelse/redigering. Faktura-status findes under Økonomi.</p>
                {isAdmin && (
                  <Button type="button" variant="secondary" className="mb-4" onClick={openAddSupplier}>
                    <Plus className="h-4 w-4" /> Tilføj leverandør
                  </Button>
                )}
                {suppliers.length === 0 ? (
                  <p className="text-sm text-gray-500">Ingen leverandører endnu.</p>
                ) : (
                  <div className="space-y-4">
                    {supplierCategories.map((cat) => {
                      const items = suppliers.filter((s) => s.category === cat)
                      if (items.length === 0) return null
                      return (
                        <div key={cat}>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                            {EVENT_SUPPLIER_CATEGORY_LABELS[cat]}
                          </p>
                          <div className="space-y-2">
                            {items.map((s) => {
                              const sf = supplierFinance[s.id]
                              const addons = supplierAddons[s.id]
                              const lineTotal = supplierLineTotal(sf, addons)
                              const hasPrice = lineTotal > 0
                              return (
                                <div key={s.id} className="rounded-lg border border-gray-200 p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-medium text-gray-900">{s.name}</p>
                                      {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
                                      {s.contact_name && <p className="text-sm text-gray-500 mt-0.5">{s.contact_name}</p>}
                                      <div className="mt-1 space-y-0.5">
                                        {s.phone && <a href={`tel:${s.phone}`} className="block text-sm text-padel-600 hover:underline">{s.phone}</a>}
                                        {s.email && <a href={`mailto:${s.email}`} className="block text-sm text-padel-600 hover:underline break-all">{s.email}</a>}
                                      </div>
                                      {isAdmin && hasPrice && (
                                        <p className="text-sm font-medium text-padel-700 mt-2">Pris: {formatCurrency(lineTotal)}</p>
                                      )}
                                      {isAdmin && sf?.on_site_from && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          På stedet: {formatTime(sf.on_site_from)}{sf.on_site_to ? ` – ${formatTime(sf.on_site_to)}` : ''}
                                        </p>
                                      )}
                                      {isAdmin && sf?.included_description && (
                                        <p className="text-xs text-gray-500 mt-0.5">Inkl.: {sf.included_description}</p>
                                      )}
                                      {isAdmin && addons?.map((a) => (
                                        <p key={a.id} className="text-xs text-amber-700 mt-0.5">
                                          Tilkøb: {a.description}{a.price != null ? ` (${formatCurrency(a.price)})` : ''}
                                        </p>
                                      ))}
                                      {isAdmin && !addons?.length && sf?.addon_description && (
                                        <p className="text-xs text-amber-700 mt-0.5">
                                          Tilkøb: {sf.addon_description}{sf.addon_price != null ? ` (${formatCurrency(sf.addon_price)})` : ''}
                                        </p>
                                      )}
                                      {s.notes && <p className="text-sm text-gray-500 mt-2">{s.notes}</p>}
                                    </div>
                                    {isAdmin && (
                                      <div className="flex shrink-0 gap-1">
                                        <button type="button" onClick={() => openEditSupplier(s)} className="rounded p-1.5 text-gray-400 hover:text-padel-700 hover:bg-gray-100" aria-label="Rediger">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteSupplier(s.id)} className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Slet">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'opgaver' && (
              <section>
                {isAdmin && (
                  <Button type="button" variant="secondary" className="mb-4" onClick={openAddTodo}>
                    <Plus className="h-4 w-4" /> Tilføj opgave
                  </Button>
                )}
                {todos.length === 0 ? (
                  <p className="text-sm text-gray-500">Ingen opgaver endnu.</p>
                ) : (
                  <ul className="space-y-2">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleTodo(todo)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            todo.completed ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white'
                          }`}
                          aria-label={todo.completed ? 'Markér uafsluttet' : 'Markér færdig'}
                        >
                          {todo.completed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{todo.title}</p>
                          {todo.description && <p className="text-sm text-gray-500 mt-0.5">{todo.description}</p>}
                          {todo.due_date && <p className="text-xs text-gray-400 mt-1">Deadline: {formatDate(todo.due_date)}</p>}
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => openEditTodo(todo)} className="rounded p-1 text-gray-400 hover:text-padel-700 hover:bg-gray-100" aria-label="Rediger">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => deleteTodo(todo.id)} className="rounded p-1 text-gray-400 hover:text-red-600" aria-label="Slet">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {activeTab === 'marketing' && (
              <EventMarketingSection
                eventId={event.id}
                marketing={marketing}
                items={marketingItems}
                itemFinance={marketingItemFinance}
                itemAddons={marketingItemAddons}
                isAdmin={isAdmin}
                onUpdated={onUpdated}
              />
            )}

            {activeTab === 'okonomi' && isAdmin && (
              <EventEconomyTab
                eventId={event.id}
                finance={finance}
                suppliers={suppliers}
                supplierFinance={supplierFinance}
                supplierAddons={supplierAddons}
                marketingItems={marketingItems}
                marketingItemFinance={marketingItemFinance}
                marketingItemAddons={marketingItemAddons}
                onUpdated={onUpdated}
              />
            )}
          </div>
        </div>
      )}

      <Modal
        open={supplierModal}
        onClose={() => { setSupplierModal(false); resetSupplierForm() }}
        title={editingSupplierId ? 'Rediger leverandør' : 'Tilføj leverandør'}
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Select label="Kategori" value={supCategory} onChange={(e) => setSupCategory(e.target.value as EventSupplierCategory)}>
            {supplierCategories.map((c) => (
              <option key={c} value={c}>{EVENT_SUPPLIER_CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
          <Input label="Navn" value={supName} onChange={(e) => setSupName(e.target.value)} required />
          <Input label="Kontaktperson" value={supContact} onChange={(e) => setSupContact(e.target.value)} />
          <Input label="Telefon" type="tel" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} />
          <Input label="E-mail" type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} />
          <Input label="Hvad leverer de?" value={supDesc} onChange={(e) => setSupDesc(e.target.value)} />
          <Textarea label="Noter (synlige for alle)" value={supNotes} onChange={(e) => setSupNotes(e.target.value)} rows={2} />
          <div className="rounded-lg border border-padel-200 bg-padel-50/30 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-padel-800">Priser & aftale</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Aftalt pris (DKK)" type="number" step="0.01" value={supPrice} onChange={(e) => setSupPrice(e.target.value)} />
              <Input label="På stedet fra" type="time" value={supOnFrom} onChange={(e) => setSupOnFrom(e.target.value)} />
              <Input label="På stedet til" type="time" value={supOnTo} onChange={(e) => setSupOnTo(e.target.value)} />
            </div>
            <Textarea label="Inkluderet i prisen" value={supIncluded} onChange={(e) => setSupIncluded(e.target.value)} rows={2} placeholder="Fx 50 kuverter, 2 serveringspersoner, opvask..." />
            <AddonListEditor addons={supAddons} onChange={setSupAddons} />
          </div>
          <Button type="submit" loading={saving}>{editingSupplierId ? 'Gem' : 'Tilføj'}</Button>
        </form>
      </Modal>

      <Modal
        open={todoModal}
        onClose={() => { setTodoModal(false); resetTodoForm() }}
        title={editingTodoId ? 'Rediger opgave' : 'Tilføj opgave'}
      >
        <form onSubmit={handleTodoSubmit} className="space-y-4">
          <Input label="Opgave" value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} required />
          <Textarea label="Beskrivelse" value={todoDesc} onChange={(e) => setTodoDesc(e.target.value)} rows={2} />
          <Input label="Deadline" type="date" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} />
          <Button type="submit" loading={saving}>{editingTodoId ? 'Gem' : 'Tilføj'}</Button>
        </form>
      </Modal>
    </Card>
  )
}
