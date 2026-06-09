import { useEffect, useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AddonListEditor } from '@/components/company-events/AddonListEditor'
import { calcEventEconomyTotals } from '@/lib/eventEconomyTotals'
import {
  addonDraftsFromRecords,
  emptyAddonDraft,
  replaceMarketingItemAddons,
  replaceSupplierAddons,
  type AddonDraft,
} from '@/lib/financeAddons'
import { formatCurrency, formatTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  EVENT_SUPPLIER_CATEGORY_LABELS,
  MARKETING_PRODUCT_LABELS,
  type CompanyEventFinance,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type CompanyEventSupplier,
  type CompanyEventSupplierAddon,
  type CompanyEventSupplierFinance,
  type EventSupplierCategory,
} from '@/types'

function InvoiceBadges({ sent, paid }: { sent: boolean; paid: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
        {sent ? 'Faktura sendt' : 'Faktura ikke sendt'}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
        {paid ? 'Betalt' : 'Ikke betalt'}
      </span>
    </div>
  )
}

interface EventEconomyTabProps {
  eventId: string
  finance: CompanyEventFinance | null
  suppliers: CompanyEventSupplier[]
  supplierFinance: Record<string, CompanyEventSupplierFinance>
  supplierAddons: Record<string, CompanyEventSupplierAddon[]>
  marketingItems: CompanyEventMarketingItem[]
  marketingItemFinance: Record<string, CompanyEventMarketingItemFinance>
  marketingItemAddons: Record<string, CompanyEventMarketingItemAddon[]>
  onUpdated: () => void
}

export function EventEconomyTab({
  eventId,
  finance,
  suppliers,
  supplierFinance,
  supplierAddons,
  marketingItems,
  marketingItemFinance,
  marketingItemAddons,
  onUpdated,
}: EventEconomyTabProps) {
  const [saving, setSaving] = useState(false)
  const [finHostPrice, setFinHostPrice] = useState(finance?.host_agreed_price?.toString() ?? '')
  const [finBudget, setFinBudget] = useState(finance?.total_budget?.toString() ?? '')
  const [finCost, setFinCost] = useState(finance?.total_cost?.toString() ?? '')
  const [finNotes, setFinNotes] = useState(finance?.financial_notes ?? '')
  const [finHostSent, setFinHostSent] = useState(finance?.host_invoice_sent ?? false)
  const [finHostPaid, setFinHostPaid] = useState(finance?.host_invoice_paid ?? false)

  useEffect(() => {
    setFinHostPrice(finance?.host_agreed_price?.toString() ?? '')
    setFinBudget(finance?.total_budget?.toString() ?? '')
    setFinCost(finance?.total_cost?.toString() ?? '')
    setFinNotes(finance?.financial_notes ?? '')
    setFinHostSent(finance?.host_invoice_sent ?? false)
    setFinHostPaid(finance?.host_invoice_paid ?? false)
  }, [finance, eventId])

  const totals = calcEventEconomyTotals(
    finance,
    suppliers,
    supplierFinance,
    supplierAddons,
    marketingItems,
    marketingItemFinance,
    marketingItemAddons,
  )

  const activeMarketing = marketingItems.filter((i) => i.status !== 'annulleret')
  const supplierCategories = Object.keys(EVENT_SUPPLIER_CATEGORY_LABELS) as EventSupplierCategory[]

  async function saveEventFinance(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('company_event_finance').upsert({
      event_id: eventId,
      host_agreed_price: finHostPrice ? parseFloat(finHostPrice) : null,
      host_invoice_sent: finHostSent,
      host_invoice_paid: finHostPaid,
      total_budget: finBudget ? parseFloat(finBudget) : null,
      total_cost: finCost ? parseFloat(finCost) : null,
      financial_notes: finNotes.trim() || null,
    })
    setSaving(false)
    onUpdated()
  }

  async function saveSupplierFinance(
    supplierId: string,
    data: Partial<CompanyEventSupplierFinance>,
    addons: AddonDraft[],
  ) {
    setSaving(true)
    const { addon_description: _d, addon_price: _p, ...rest } = data
    await supabase.from('company_event_supplier_finance').upsert({ supplier_id: supplierId, ...rest })
    await replaceSupplierAddons(supplierId, addons)
    setSaving(false)
    onUpdated()
  }

  async function saveMarketingFinance(
    itemId: string,
    data: Partial<CompanyEventMarketingItemFinance>,
    addons: AddonDraft[],
  ) {
    setSaving(true)
    const { addon_description: _d, addon_price: _p, ...rest } = data
    await supabase.from('company_event_marketing_item_finance').upsert({ item_id: itemId, ...rest })
    await replaceMarketingItemAddons(itemId, addons)
    setSaving(false)
    onUpdated()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <Lock className="h-4 w-4" />
        Samlet økonomi — kun admin
      </div>

      {/* Totaloverblik */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Totaloverblik</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TotalCell label="Indtægt (vært)" value={formatCurrency(totals.hostIncome)} />
          <TotalCell label="Budget" value={formatCurrency(totals.budget)} />
          <TotalCell label="Samlede omkostninger" value={formatCurrency(totals.grandCostTotal)} highlight />
          <TotalCell
            label="Resultat"
            value={formatCurrency(totals.margin)}
            highlight={totals.margin < 0}
            positive={totals.margin >= 0}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm border-t border-amber-200/80 pt-3">
          <div>
            <span className="text-gray-500">Leverandører:</span>{' '}
            <span className="font-medium">{formatCurrency(totals.supplierTotal)}</span>
            {totals.supplierAddons > 0 && (
              <span className="text-gray-500 text-xs block">heraf tilkøb {formatCurrency(totals.supplierAddons)}</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Marketing:</span>{' '}
            <span className="font-medium">{formatCurrency(totals.marketingTotal)}</span>
            {totals.marketingAddons > 0 && (
              <span className="text-gray-500 text-xs block">heraf tilkøb {formatCurrency(totals.marketingAddons)}</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Manuel total omk.:</span>{' '}
            <span className="font-medium">{formatCurrency(finance?.total_cost ?? null)}</span>
          </div>
        </div>
      </div>

      {/* Vært / event */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Aftale med vært / firma</h4>
        <form onSubmit={saveEventFinance} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Aftalt pris med vært (DKK)" type="number" step="0.01" value={finHostPrice} onChange={(e) => setFinHostPrice(e.target.value)} />
            <Input label="Budget (DKK)" type="number" step="0.01" value={finBudget} onChange={(e) => setFinBudget(e.target.value)} />
            <Input label="Manuel samlet omkostning (DKK)" type="number" step="0.01" value={finCost} onChange={(e) => setFinCost(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={finHostSent} onChange={(e) => setFinHostSent(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
              Faktura sendt til vært
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={finHostPaid} onChange={(e) => setFinHostPaid(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
              Betalt af vært
            </label>
          </div>
          <Textarea label="Økonomiske noter" value={finNotes} onChange={(e) => setFinNotes(e.target.value)} rows={2} />
          <Button type="submit" loading={saving} variant="secondary">Gem vært-økonomi</Button>
        </form>
        {finance && <div className="mt-3"><InvoiceBadges sent={finance.host_invoice_sent} paid={finance.host_invoice_paid} /></div>}
      </section>

      {/* Leverandører */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Leverandører (mad, drikke, præmier m.m.)</h4>
        <p className="text-xs text-gray-500 mb-4">Subtotal: {formatCurrency(totals.supplierTotal)}</p>
        {suppliers.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen leverandører — tilføj under fanen Leverandører.</p>
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
                  <div className="space-y-3">
                    {items.map((s) => (
                      <SupplierEconomyForm
                        key={s.id}
                        supplier={s}
                        finance={supplierFinance[s.id]}
                        addons={supplierAddons[s.id]}
                        saving={saving}
                        onSave={(data, addons) => saveSupplierFinance(s.id, data, addons)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Marketing */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Marketing & tilbehør</h4>
        <p className="text-xs text-gray-500 mb-4">Subtotal: {formatCurrency(totals.marketingTotal)}</p>
        {activeMarketing.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen marketing-bestillinger — tilføj under fanen Marketing.</p>
        ) : (
          <div className="space-y-3">
            {activeMarketing.map((item) => (
              <MarketingEconomyForm
                key={item.id}
                item={item}
                finance={marketingItemFinance[item.id]}
                addons={marketingItemAddons[item.id]}
                saving={saving}
                onSave={(data, addons) => saveMarketingFinance(item.id, data, addons)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TotalCell({
  label,
  value,
  highlight,
  positive,
}: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? (positive === false ? 'border-red-200 bg-red-50/50' : positive ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-white') : 'border-gray-100 bg-white'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

function supplierAddonsToDrafts(
  addons: CompanyEventSupplierAddon[] | undefined,
  finance: CompanyEventSupplierFinance | undefined,
): AddonDraft[] {
  if (addons?.length) return addonDraftsFromRecords(addons)
  if (finance?.addon_description || finance?.addon_price != null) {
    return [{ description: finance.addon_description ?? '', price: finance.addon_price?.toString() ?? '' }]
  }
  return [emptyAddonDraft()]
}

function SupplierEconomyForm({
  supplier,
  finance,
  addons,
  saving,
  onSave,
}: {
  supplier: CompanyEventSupplier
  finance: CompanyEventSupplierFinance | undefined
  addons: CompanyEventSupplierAddon[] | undefined
  saving: boolean
  onSave: (data: Partial<CompanyEventSupplierFinance>, addons: AddonDraft[]) => void
}) {
  const [price, setPrice] = useState(finance?.agreed_price?.toString() ?? '')
  const [onFrom, setOnFrom] = useState(finance?.on_site_from?.slice(0, 5) ?? '')
  const [onTo, setOnTo] = useState(finance?.on_site_to?.slice(0, 5) ?? '')
  const [included, setIncluded] = useState(finance?.included_description ?? '')
  const [addonDrafts, setAddonDrafts] = useState<AddonDraft[]>([emptyAddonDraft()])
  const [sent, setSent] = useState(finance?.invoice_sent ?? false)
  const [paid, setPaid] = useState(finance?.invoice_paid ?? false)
  const [notes, setNotes] = useState(finance?.financial_notes ?? '')

  useEffect(() => {
    setPrice(finance?.agreed_price?.toString() ?? '')
    setOnFrom(finance?.on_site_from?.slice(0, 5) ?? '')
    setOnTo(finance?.on_site_to?.slice(0, 5) ?? '')
    setIncluded(finance?.included_description ?? '')
    setAddonDrafts(supplierAddonsToDrafts(addons, finance))
    setSent(finance?.invoice_sent ?? false)
    setPaid(finance?.invoice_paid ?? false)
    setNotes(finance?.financial_notes ?? '')
  }, [finance, addons])

  const addonPreviewTotal = addonDrafts
    .filter((d) => d.description.trim())
    .reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0)
  const lineTotal = (parseFloat(price) || 0) + addonPreviewTotal

  return (
    <form
      className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          agreed_price: price ? parseFloat(price) : null,
          on_site_from: onFrom || null,
          on_site_to: onTo || null,
          included_description: included.trim() || null,
          invoice_sent: sent,
          invoice_paid: paid,
          financial_notes: notes.trim() || null,
        }, addonDrafts)
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-gray-900">{supplier.name}</p>
        <p className="text-sm font-semibold text-padel-700">Linje: {formatCurrency(lineTotal)}</p>
      </div>
      {supplier.description && <p className="text-xs text-gray-500">{supplier.description}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Aftalt pris (DKK)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input label="På stedet fra" type="time" value={onFrom} onChange={(e) => setOnFrom(e.target.value)} />
        <Input label="På stedet til" type="time" value={onTo} onChange={(e) => setOnTo(e.target.value)} />
      </div>
      {(onFrom || onTo) && (
        <p className="text-xs text-gray-500">
          Tid på stedet: {onFrom && formatTime(onFrom)}{onFrom && onTo && ' – '}{onTo && formatTime(onTo)}
        </p>
      )}
      <Textarea label="Inkluderet i prisen" value={included} onChange={(e) => setIncluded(e.target.value)} rows={2} placeholder="Fx 50 kuverter, 2 serveringspersoner, opvask..." />
      <AddonListEditor addons={addonDrafts} onChange={setAddonDrafts} />
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sent} onChange={(e) => setSent(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
          Faktura sendt
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
          Betalt
        </label>
      </div>
      <Textarea label="Pris-noter" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button type="submit" variant="secondary" loading={saving} className="text-sm">Gem leverandør</Button>
    </form>
  )
}

function marketingAddonsToDrafts(
  addons: CompanyEventMarketingItemAddon[] | undefined,
  finance: CompanyEventMarketingItemFinance | undefined,
): AddonDraft[] {
  if (addons?.length) return addonDraftsFromRecords(addons)
  if (finance?.addon_description || finance?.addon_price != null) {
    return [{ description: finance.addon_description ?? '', price: finance.addon_price?.toString() ?? '' }]
  }
  return [emptyAddonDraft()]
}

function MarketingEconomyForm({
  item,
  finance,
  addons,
  saving,
  onSave,
}: {
  item: CompanyEventMarketingItem
  finance: CompanyEventMarketingItemFinance | undefined
  addons: CompanyEventMarketingItemAddon[] | undefined
  saving: boolean
  onSave: (data: Partial<CompanyEventMarketingItemFinance>, addons: AddonDraft[]) => void
}) {
  const [unitPrice, setUnitPrice] = useState(finance?.unit_price?.toString() ?? '')
  const [totalPrice, setTotalPrice] = useState(finance?.total_price?.toString() ?? '')
  const [included, setIncluded] = useState(finance?.included_description ?? '')
  const [addonDrafts, setAddonDrafts] = useState<AddonDraft[]>([emptyAddonDraft()])
  const [sent, setSent] = useState(finance?.invoice_sent ?? false)
  const [paid, setPaid] = useState(finance?.invoice_paid ?? false)
  const [notes, setNotes] = useState(finance?.financial_notes ?? '')

  useEffect(() => {
    setUnitPrice(finance?.unit_price?.toString() ?? '')
    setTotalPrice(finance?.total_price?.toString() ?? '')
    setIncluded(finance?.included_description ?? '')
    setAddonDrafts(marketingAddonsToDrafts(addons, finance))
    setSent(finance?.invoice_sent ?? false)
    setPaid(finance?.invoice_paid ?? false)
    setNotes(finance?.financial_notes ?? '')
  }, [finance, addons])

  const base = totalPrice ? parseFloat(totalPrice) : (parseFloat(unitPrice) || 0) * item.quantity
  const addonPreviewTotal = addonDrafts
    .filter((d) => d.description.trim())
    .reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0)
  const lineTotal = base + addonPreviewTotal

  return (
    <form
      className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          unit_price: unitPrice ? parseFloat(unitPrice) : null,
          total_price: totalPrice ? parseFloat(totalPrice) : null,
          included_description: included.trim() || null,
          invoice_sent: sent,
          invoice_paid: paid,
          financial_notes: notes.trim() || null,
        }, addonDrafts)
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900">{item.item_name}</p>
          <p className="text-xs text-gray-500">{MARKETING_PRODUCT_LABELS[item.product_type]} · {item.quantity} stk.</p>
        </div>
        <p className="text-sm font-semibold text-padel-700">Linje: {formatCurrency(lineTotal)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Enhedspris (DKK)" type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        <Input label="Totalpris (DKK)" type="number" step="0.01" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
      </div>
      <Textarea label="Inkluderet i prisen" value={included} onChange={(e) => setIncluded(e.target.value)} rows={2} placeholder="Fx montering, 2 roll-ups, levering..." />
      <AddonListEditor addons={addonDrafts} onChange={setAddonDrafts} />
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sent} onChange={(e) => setSent(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
          Faktura sendt
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
          Betalt
        </label>
      </div>
      <Textarea label="Pris-noter" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button type="submit" variant="secondary" loading={saving} className="text-sm">Gem marketing</Button>
    </form>
  )
}
