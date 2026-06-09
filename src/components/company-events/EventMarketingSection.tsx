import { useRef, useState, useEffect, type FormEvent } from 'react'
import {
  ImagePlus,
  Megaphone,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadEventLogo, deleteEventLogo } from '@/lib/eventMarketingMedia'
import { MARKETING_QUICK_PACKAGES } from '@/lib/marketingQuickPackages'
import { AddonListEditor } from '@/components/company-events/AddonListEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { marketingLineTotal } from '@/lib/eventEconomyTotals'
import {
  addonDraftsFromRecords,
  emptyAddonDraft,
  replaceMarketingItemAddons,
  type AddonDraft,
} from '@/lib/financeAddons'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  MARKETING_ORDER_STATUS_LABELS,
  MARKETING_PRODUCT_LABELS,
  type CompanyEventMarketing,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type MarketingOrderStatus,
  type MarketingProductType,
} from '@/types'

const productTypes = Object.keys(MARKETING_PRODUCT_LABELS) as MarketingProductType[]
const orderStatuses = Object.keys(MARKETING_ORDER_STATUS_LABELS) as MarketingOrderStatus[]

const statusClass: Record<MarketingOrderStatus, string> = {
  forespurgt: 'bg-gray-100 text-gray-700',
  godkendt: 'bg-blue-100 text-blue-800',
  bestilt: 'bg-indigo-100 text-indigo-800',
  i_produktion: 'bg-amber-100 text-amber-800',
  leveret: 'bg-green-100 text-green-800',
  annulleret: 'bg-red-100 text-red-800',
}

const emptyItemForm = {
  product_type: 'banner' as MarketingProductType,
  package_name: '',
  item_name: '',
  quantity: '1',
  size_specs: '',
  material: '',
  print_method: '',
  color_specs: '',
  design_notes: '',
  status: 'forespurgt' as MarketingOrderStatus,
  supplier_name: '',
  order_date: '',
  expected_delivery: '',
  delivered_date: '',
  notes: '',
  unit_price: '',
  total_price: '',
  included_description: '',
}

interface EventMarketingSectionProps {
  eventId: string
  marketing: CompanyEventMarketing | null
  items: CompanyEventMarketingItem[]
  itemFinance: Record<string, CompanyEventMarketingItemFinance>
  itemAddons: Record<string, CompanyEventMarketingItemAddon[]>
  isAdmin: boolean
  onUpdated: () => void
}

export function EventMarketingSection({
  eventId,
  marketing,
  items,
  itemFinance,
  itemAddons,
  isAdmin,
  onUpdated,
}: EventMarketingSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [itemAddonDrafts, setItemAddonDrafts] = useState<AddonDraft[]>([emptyAddonDraft()])

  const [brandColors, setBrandColors] = useState(marketing?.brand_colors ?? '')
  const [placementNotes, setPlacementNotes] = useState(marketing?.logo_placement_notes ?? '')
  const [designApproved, setDesignApproved] = useState(marketing?.design_approved ?? false)
  const [approvedBy, setApprovedBy] = useState(marketing?.design_approved_by ?? '')

  useEffect(() => {
    setBrandColors(marketing?.brand_colors ?? '')
    setPlacementNotes(marketing?.logo_placement_notes ?? '')
    setDesignApproved(marketing?.design_approved ?? false)
    setApprovedBy(marketing?.design_approved_by ?? '')
  }, [marketing, eventId])

  const activeItems = items.filter((i) => i.status !== 'annulleret')
  const deliveredCount = activeItems.filter((i) => i.status === 'leveret').length
  const totalQty = activeItems.reduce((sum, i) => sum + i.quantity, 0)

  function financeToForm(finance?: CompanyEventMarketingItemFinance) {
    return {
      unit_price: finance?.unit_price?.toString() ?? '',
      total_price: finance?.total_price?.toString() ?? '',
      included_description: finance?.included_description ?? '',
    }
  }

  function marketingAddonsToDrafts(itemId: string, finance?: CompanyEventMarketingItemFinance): AddonDraft[] {
    const fromDb = itemAddons[itemId]
    if (fromDb?.length) return addonDraftsFromRecords(fromDb)
    if (finance?.addon_description || finance?.addon_price != null) {
      return [{ description: finance.addon_description ?? '', price: finance.addon_price?.toString() ?? '' }]
    }
    return [emptyAddonDraft()]
  }

  function openAddItem(pkg?: (typeof MARKETING_QUICK_PACKAGES)[0]) {
    setEditingItemId(null)
    setItemAddonDrafts([emptyAddonDraft()])
    if (pkg) {
      setItemForm({
        product_type: pkg.product_type,
        package_name: pkg.package_name,
        item_name: pkg.item_name,
        quantity: String(pkg.quantity),
        size_specs: pkg.size_specs ?? '',
        material: pkg.material ?? '',
        print_method: pkg.print_method ?? '',
        color_specs: pkg.color_specs ?? '',
        design_notes: pkg.design_notes ?? '',
        status: 'forespurgt',
        supplier_name: '',
        order_date: '',
        expected_delivery: '',
        delivered_date: '',
        notes: '',
        ...financeToForm(),
      })
    } else {
      setItemForm(emptyItemForm)
    }
    setItemModal(true)
  }

  function openEditItem(item: CompanyEventMarketingItem) {
    const finance = itemFinance[item.id]
    setEditingItemId(item.id)
    setItemAddonDrafts(marketingAddonsToDrafts(item.id, finance))
    setItemForm({
      product_type: item.product_type,
      package_name: item.package_name ?? '',
      item_name: item.item_name,
      quantity: String(item.quantity),
      size_specs: item.size_specs ?? '',
      material: item.material ?? '',
      print_method: item.print_method ?? '',
      color_specs: item.color_specs ?? '',
      design_notes: item.design_notes ?? '',
      status: item.status,
      supplier_name: item.supplier_name ?? '',
      order_date: item.order_date ?? '',
      expected_delivery: item.expected_delivery ?? '',
      delivered_date: item.delivered_date ?? '',
      notes: item.notes ?? '',
      ...financeToForm(finance),
    })
    setItemModal(true)
  }

  async function saveItemFinance(itemId: string) {
    if (!isAdmin) return
    await supabase.from('company_event_marketing_item_finance').upsert({
      item_id: itemId,
      unit_price: itemForm.unit_price ? parseFloat(itemForm.unit_price) : null,
      total_price: itemForm.total_price ? parseFloat(itemForm.total_price) : null,
      included_description: itemForm.included_description.trim() || null,
    })
    await replaceMarketingItemAddons(itemId, itemAddonDrafts)
  }

  async function handleLogoUpload(file: File) {
    if (!isAdmin) return
    setUploading(true)
    const result = await uploadEventLogo(file, eventId)
    if ('error' in result) {
      alert(result.error)
      setUploading(false)
      return
    }
    if (marketing?.logo_path) await deleteEventLogo(marketing.logo_path)
    await supabase.from('company_event_marketing').upsert({
      event_id: eventId,
      logo_url: result.url,
      logo_path: result.path,
      logo_filename: result.filename,
    })
    setUploading(false)
    onUpdated()
  }

  async function saveMarketingMeta(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    await supabase.from('company_event_marketing').upsert({
      event_id: eventId,
      brand_colors: brandColors.trim() || null,
      logo_placement_notes: placementNotes.trim() || null,
      design_approved: designApproved,
      design_approved_by: designApproved ? approvedBy.trim() || null : null,
      design_approved_at: designApproved ? new Date().toISOString() : null,
    })
    setSaving(false)
    onUpdated()
  }

  async function handleItemSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !itemForm.item_name.trim()) return
    setSaving(true)
    const payload = {
      event_id: eventId,
      product_type: itemForm.product_type,
      package_name: itemForm.package_name.trim() || null,
      item_name: itemForm.item_name.trim(),
      quantity: parseInt(itemForm.quantity, 10) || 1,
      size_specs: itemForm.size_specs.trim() || null,
      material: itemForm.material.trim() || null,
      print_method: itemForm.print_method.trim() || null,
      color_specs: itemForm.color_specs.trim() || null,
      design_notes: itemForm.design_notes.trim() || null,
      status: itemForm.status,
      supplier_name: itemForm.supplier_name.trim() || null,
      order_date: itemForm.order_date || null,
      expected_delivery: itemForm.expected_delivery || null,
      delivered_date: itemForm.delivered_date || null,
      notes: itemForm.notes.trim() || null,
    }

    let itemId = editingItemId
    if (editingItemId) {
      await supabase.from('company_event_marketing_items').update(payload).eq('id', editingItemId)
    } else {
      const { data } = await supabase
        .from('company_event_marketing_items')
        .insert({ ...payload, sort_order: items.length })
        .select('id')
        .single()
      if (data) {
        itemId = data.id
        await supabase.from('company_event_marketing_item_finance').insert({ item_id: data.id })
      }
    }
    if (itemId) await saveItemFinance(itemId)
    setSaving(false)
    setItemModal(false)
    onUpdated()
  }

  async function deleteItem(id: string) {
    if (!isAdmin || !confirm('Slet bestilling?')) return
    await supabase.from('company_event_marketing_items').delete().eq('id', id)
    onUpdated()
  }

  return (
    <section className="rounded-lg border border-padel-200 bg-padel-50/30 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-padel-600" />
        Marketing-tilbehør
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Logo, bestillinger, pakker og priser. Faktura-status og samlet økonomi findes under fanen Økonomi.
      </p>

      {/* Bestillingsoversigt */}
      {activeItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Bestilt oversigt
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {productTypes.map((type) => {
              const typeItems = activeItems.filter((i) => i.product_type === type)
              if (typeItems.length === 0) return null
              const qty = typeItems.reduce((s, i) => s + i.quantity, 0)
              return (
                <div key={type} className="text-sm rounded-md bg-gray-50 px-3 py-2">
                  <span className="font-medium text-gray-900">{MARKETING_PRODUCT_LABELS[type]}</span>
                  <span className="text-gray-500"> — {typeItems.length} linje{typeItems.length === 1 ? '' : 'r'}, {qty} stk.</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {deliveredCount} af {activeItems.length} leveret · {totalQty} enheder i alt
          </p>
        </div>
      )}

      {/* Logo */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">Kundens logo</p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {marketing?.logo_url ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex items-center justify-center min-w-[140px] min-h-[100px]">
              <img src={marketing.logo_url} alt="Event logo" className="max-h-24 max-w-[200px] object-contain" />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
              <ImagePlus className="h-8 w-8 mx-auto mb-1 opacity-50" />
              Intet logo uploadet
            </div>
          )}
          <div className="flex-1 space-y-2">
            {marketing?.logo_filename && (
              <p className="text-sm text-gray-600">{marketing.logo_filename}</p>
            )}
            {marketing?.design_approved && (
              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Design godkendt{marketing.design_approved_by ? ` — ${marketing.design_approved_by}` : ''}
              </span>
            )}
            {isAdmin && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf,.svg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleLogoUpload(f)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {marketing?.logo_url ? 'Skift logo' : 'Upload logo'}
                </Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={saveMarketingMeta} className="mt-4 space-y-3 border-t border-gray-100 pt-3">
          {isAdmin ? (
            <>
              <Input label="Brandfarver (PMS/hex)" value={brandColors} onChange={(e) => setBrandColors(e.target.value)} placeholder="Fx PMS 348 C, #00A651" />
              <Textarea label="Logo-placering & designinstruktioner" value={placementNotes} onChange={(e) => setPlacementNotes(e.target.value)} rows={2} placeholder="Hvor skal logoet sidde? Minimum størrelse? Ingen gradient?" />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={designApproved} onChange={(e) => setDesignApproved(e.target.checked)} className="rounded border-gray-300 text-padel-600" />
                  Design godkendt af kunde
                </label>
                {designApproved && (
                  <Input label="Godkendt af" value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} className="max-w-xs" />
                )}
              </div>
              <Button type="submit" variant="secondary" loading={saving} className="text-sm">Gem logo-info</Button>
            </>
          ) : (
            <>
              {brandColors && <p className="text-sm"><span className="text-gray-500">Farver:</span> {brandColors}</p>}
              {placementNotes && <p className="text-sm"><span className="text-gray-500">Placering:</span> {placementNotes}</p>}
            </>
          )}
        </form>
      </div>

      {/* Hurtigpakker + tilføj */}
      {isAdmin && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Hurtigpakker</p>
          <div className="flex flex-wrap gap-2">
            {MARKETING_QUICK_PACKAGES.map((pkg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openAddItem(pkg)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-padel-300 hover:bg-padel-50"
              >
                + {pkg.item_name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => openAddItem()}
              className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-padel-600 hover:bg-padel-50"
            >
              + Tilpasset vare
            </button>
          </div>
        </div>
      )}

      {/* Bestillingsliste */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Ingen marketing-bestillinger endnu.</p>
      ) : (
        <div className="space-y-3">
          {productTypes.map((type) => {
            const typeItems = items.filter((i) => i.product_type === type)
            if (typeItems.length === 0) return null
            return (
              <div key={type}>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  {MARKETING_PRODUCT_LABELS[type]}
                </p>
                <div className="space-y-2">
                  {typeItems.map((item) => (
                    <MarketingItemCard
                      key={item.id}
                      item={item}
                      finance={itemFinance[item.id]}
                      addons={itemAddons[item.id]}
                      isAdmin={isAdmin}
                      onEdit={() => openEditItem(item)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isAdmin && items.length > 0 && (
        <Button type="button" variant="secondary" className="mt-3" onClick={() => openAddItem()}>
          <Plus className="h-4 w-4" />
          Tilføj bestilling
        </Button>
      )}

      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={editingItemId ? 'Rediger bestilling' : 'Tilføj marketing-bestilling'}
      >
        <form onSubmit={handleItemSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Select label="Type" value={itemForm.product_type} onChange={(e) => setItemForm({ ...itemForm, product_type: e.target.value as MarketingProductType })}>
            {productTypes.map((t) => <option key={t} value={t}>{MARKETING_PRODUCT_LABELS[t]}</option>)}
          </Select>
          <Input label="Pakkenavn" value={itemForm.package_name} onChange={(e) => setItemForm({ ...itemForm, package_name: e.target.value })} placeholder="Fx Standard bannerpakke" />
          <Input label="Vare / produkt" value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} required />
          <Input label="Antal" type="number" min="1" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} required />
          <Input label="Størrelse / specifikationer" value={itemForm.size_specs} onChange={(e) => setItemForm({ ...itemForm, size_specs: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Materiale" value={itemForm.material} onChange={(e) => setItemForm({ ...itemForm, material: e.target.value })} />
            <Input label="Trykmetode" value={itemForm.print_method} onChange={(e) => setItemForm({ ...itemForm, print_method: e.target.value })} />
          </div>
          <Input label="Farver" value={itemForm.color_specs} onChange={(e) => setItemForm({ ...itemForm, color_specs: e.target.value })} />
          <Textarea label="Design-noter" value={itemForm.design_notes} onChange={(e) => setItemForm({ ...itemForm, design_notes: e.target.value })} rows={2} />
          <Select label="Status" value={itemForm.status} onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as MarketingOrderStatus })}>
            {orderStatuses.map((s) => <option key={s} value={s}>{MARKETING_ORDER_STATUS_LABELS[s]}</option>)}
          </Select>
          <Input label="Leverandør / trykkeri" value={itemForm.supplier_name} onChange={(e) => setItemForm({ ...itemForm, supplier_name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Bestillingsdato" type="date" value={itemForm.order_date} onChange={(e) => setItemForm({ ...itemForm, order_date: e.target.value })} />
            <Input label="Forventet levering" type="date" value={itemForm.expected_delivery} onChange={(e) => setItemForm({ ...itemForm, expected_delivery: e.target.value })} />
            <Input label="Leveret dato" type="date" value={itemForm.delivered_date} onChange={(e) => setItemForm({ ...itemForm, delivered_date: e.target.value })} />
          </div>
          <Textarea label="Noter (synlige for alle)" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} rows={2} />
          {isAdmin && (
            <div className="rounded-lg border border-padel-200 bg-padel-50/30 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-padel-800">Priser</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Enhedspris (DKK)" type="number" step="0.01" value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })} />
                <Input label="Totalpris (DKK)" type="number" step="0.01" value={itemForm.total_price} onChange={(e) => setItemForm({ ...itemForm, total_price: e.target.value })} />
              </div>
              <Textarea label="Inkluderet i prisen" value={itemForm.included_description} onChange={(e) => setItemForm({ ...itemForm, included_description: e.target.value })} rows={2} placeholder="Fx montering, levering..." />
              <AddonListEditor addons={itemAddonDrafts} onChange={setItemAddonDrafts} />
            </div>
          )}
          <Button type="submit" loading={saving}>{editingItemId ? 'Gem' : 'Tilføj'}</Button>
        </form>
      </Modal>
    </section>
  )
}

function MarketingItemCard({
  item,
  finance,
  addons,
  isAdmin,
  onEdit,
  onDelete,
}: {
  item: CompanyEventMarketingItem
  finance?: CompanyEventMarketingItemFinance
  addons?: CompanyEventMarketingItemAddon[]
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const lineTotal = marketingLineTotal(item, finance, addons)
  const hasLineTotal = lineTotal > 0
  const specs = [
    item.package_name && `Pakke: ${item.package_name}`,
    item.size_specs && `Størrelse: ${item.size_specs}`,
    item.material && `Materiale: ${item.material}`,
    item.print_method && `Tryk: ${item.print_method}`,
    item.color_specs && `Farver: ${item.color_specs}`,
    item.supplier_name && `Leverandør: ${item.supplier_name}`,
    item.order_date && `Bestilt: ${formatDate(item.order_date)}`,
    item.expected_delivery && `Forventet: ${formatDate(item.expected_delivery)}`,
    item.delivered_date && `Leveret: ${formatDate(item.delivered_date)}`,
  ].filter(Boolean)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900">{item.item_name}</p>
            <span className="text-sm text-gray-500">× {item.quantity}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[item.status]}`}>
              {MARKETING_ORDER_STATUS_LABELS[item.status]}
            </span>
          </div>
          {specs.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {specs.map((s, i) => (
                <li key={i} className="text-xs text-gray-600">{s}</li>
              ))}
            </ul>
          )}
          {item.design_notes && <p className="text-xs text-gray-500 mt-1 italic">{item.design_notes}</p>}
          {isAdmin && hasLineTotal && (
            <p className="text-sm font-medium text-padel-700 mt-2">Pris: {formatCurrency(lineTotal)}</p>
          )}
          {isAdmin && finance?.included_description && (
            <p className="text-xs text-gray-500 mt-1">Inkl.: {finance.included_description}</p>
          )}
          {isAdmin && addons?.map((a) => (
            <p key={a.id} className="text-xs text-amber-700 mt-0.5">
              Tilkøb: {a.description}{a.price != null ? ` (${formatCurrency(a.price)})` : ''}
            </p>
          ))}
          {isAdmin && !addons?.length && finance?.addon_description && (
            <p className="text-xs text-amber-700 mt-0.5">
              Tilkøb: {finance.addon_description}{finance.addon_price != null ? ` (${formatCurrency(finance.addon_price)})` : ''}
            </p>
          )}
          {item.notes && <p className="text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">{item.notes}</p>}
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:text-padel-700 hover:bg-gray-100" aria-label="Rediger">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Slet">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
