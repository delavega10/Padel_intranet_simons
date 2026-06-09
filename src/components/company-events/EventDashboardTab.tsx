import { useState } from 'react'
import { Check, Copy, LayoutDashboard, Mail, Pencil } from 'lucide-react'
import { buildEventCustomerSummary } from '@/lib/eventCustomerSummary'
import { formatDate, formatEventCourts, formatTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import {
  COMPANY_EVENT_STATUS_LABELS,
  MARKETING_ORDER_STATUS_LABELS,
  type CompanyEvent,
  type CompanyEventMarketing,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type CompanyEventSupplier,
  type CompanyEventSupplierAddon,
  type CompanyEventSupplierFinance,
  type CompanyEventTodo,
} from '@/types'

interface EventDashboardTabProps {
  event: CompanyEvent
  marketing: CompanyEventMarketing | null
  marketingItems: CompanyEventMarketingItem[]
  suppliers: CompanyEventSupplier[]
  supplierFinance: Record<string, CompanyEventSupplierFinance>
  supplierAddons: Record<string, CompanyEventSupplierAddon[]>
  marketingItemFinance: Record<string, CompanyEventMarketingItemFinance>
  marketingItemAddons: Record<string, CompanyEventMarketingItemAddon[]>
  todos: CompanyEventTodo[]
  supplierCount: number
  isAdmin: boolean
  onEdit?: () => void
}

export function EventDashboardTab({
  event,
  marketing,
  marketingItems,
  suppliers,
  supplierFinance,
  supplierAddons,
  marketingItemFinance,
  marketingItemAddons,
  todos,
  supplierCount,
  isAdmin,
  onEdit,
}: EventDashboardTabProps) {
  const [copied, setCopied] = useState(false)
  const courtsLabel = formatEventCourts(event.whole_hall, event.court_count)
  const openTodos = todos.filter((t) => !t.completed).length
  const doneTodos = todos.filter((t) => t.completed).length
  const activeMarketing = marketingItems.filter((i) => i.status !== 'annulleret')
  const deliveredMarketing = activeMarketing.filter((i) => i.status === 'leveret').length

  const customerText = buildEventCustomerSummary({
    event,
    marketing,
    marketingItems,
    suppliers,
    supplierFinance,
    supplierAddons,
    marketingItemFinance,
    marketingItemAddons,
  })

  async function copyCustomerSummary() {
    await navigator.clipboard.writeText(customerText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function mailCustomer() {
    const email = event.host_contact_email?.trim()
    const subject = encodeURIComponent(`Event hos Simons Padel Club — ${event.title}`)
    const body = encodeURIComponent(customerText)
    const to = email ? encodeURIComponent(email) : ''
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }

  const bookedCourts = [...(event.booked_court_numbers ?? [])].sort((a, b) => a - b)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <LayoutDashboard className="h-4 w-4 text-padel-600" />
          Overblik for personalet
        </div>
        {isAdmin && onEdit && (
          <Button type="button" variant="secondary" className="text-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Rediger event
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dato" value={formatDate(event.event_date)} sub={event.event_time ? `kl. ${formatTime(event.event_time)}` : undefined} />
        <StatCard label="Baner" value={courtsLabel ?? '—'} sub={event.matchi_booked ? 'Matchi booket' : 'Matchi mangler'} highlight={!event.matchi_booked} />
        <StatCard label="Opgaver" value={`${doneTodos}/${todos.length}`} sub={openTodos > 0 ? `${openTodos} åbne` : 'Alle færdige'} highlight={openTodos > 0} />
        <StatCard label="Marketing" value={`${deliveredMarketing}/${activeMarketing.length}`} sub="leveret" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Status</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <span className="text-gray-500">Event:</span>{' '}
              <span className="font-medium text-gray-900">{COMPANY_EVENT_STATUS_LABELS[event.status]}</span>
            </li>
            {event.host_company && (
              <li><span className="text-gray-500">Firma:</span> {event.host_company}</li>
            )}
            <li>
              <span className="text-gray-500">Matchi:</span>{' '}
              {event.matchi_booked ? (
                <span className="text-green-700 font-medium">
                  Booket{bookedCourts.length > 0 ? ` — bane ${bookedCourts.join(', ')}` : ''}
                </span>
              ) : (
                <span className="text-amber-700">Ikke markeret som booket</span>
              )}
            </li>
            <li><span className="text-gray-500">Leverandører:</span> {supplierCount}</li>
            {marketing?.design_approved && (
              <li className="text-green-700 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Logo/design godkendt
              </li>
            )}
          </ul>
          {event.public_notes && (
            <div className="rounded-lg bg-padel-50 px-3 py-2 text-sm text-gray-700 border border-padel-100">
              <p className="text-xs font-medium text-padel-800 mb-1">Noter til personalet</p>
              {event.public_notes}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Åbne opgaver</h4>
          {openTodos === 0 ? (
            <p className="text-sm text-gray-500">Ingen åbne opgaver</p>
          ) : (
            <ul className="space-y-1.5">
              {todos.filter((t) => !t.completed).slice(0, 5).map((t) => (
                <li key={t.id} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-amber-500">○</span>
                  {t.title}
                  {t.due_date && <span className="text-gray-400 text-xs">({formatDate(t.due_date)})</span>}
                </li>
              ))}
              {openTodos > 5 && <li className="text-xs text-gray-400">+ {openTodos - 5} flere under Opgaver</li>}
            </ul>
          )}
        </div>
      </div>

      {activeMarketing.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Marketing-status</h4>
          <div className="flex flex-wrap gap-2">
            {activeMarketing.map((item) => (
              <span
                key={item.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
              >
                {item.item_name} — {MARKETING_ORDER_STATUS_LABELS[item.status]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-padel-200 bg-padel-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Kunde-oversigt (til mail)</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Samlet oversigt over baner, mad, drikke, marketing m.m. — uden priser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={copyCustomerSummary}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Kopieret' : 'Kopiér'}
            </Button>
            <Button type="button" onClick={mailCustomer}>
              <Mail className="h-4 w-4" />
              {event.host_contact_email ? 'Send til kunde' : 'Åbn mail'}
            </Button>
          </div>
        </div>
        {!event.host_contact_email && isAdmin && (
          <p className="text-xs text-amber-700 mb-2">
            Tilføj kundens e-mail under Info & kontakt for at pre-udfylde modtager.
          </p>
        )}
        <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 font-sans max-h-[28rem] overflow-y-auto">
          {customerText}
        </pre>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${highlight ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'}`}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}
