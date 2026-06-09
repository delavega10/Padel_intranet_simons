import { supabase } from '@/lib/supabase'
import type {
  CompanyEventMarketingItemAddon,
  CompanyEventSupplierAddon,
} from '@/types'

export interface AddonDraft {
  id?: string
  description: string
  price: string
}

export function emptyAddonDraft(): AddonDraft {
  return { description: '', price: '' }
}

export function addonsSum(addons: { price: number | null }[]): number {
  return addons.reduce((sum, a) => sum + (a.price ?? 0), 0)
}

export function addonDraftsFromRecords(
  addons: CompanyEventSupplierAddon[] | CompanyEventMarketingItemAddon[],
): AddonDraft[] {
  return addons.map((a) => ({
    id: a.id,
    description: a.description,
    price: a.price?.toString() ?? '',
  }))
}

export async function replaceSupplierAddons(supplierId: string, drafts: AddonDraft[]) {
  await supabase.from('company_event_supplier_addons').delete().eq('supplier_id', supplierId)
  const rows = drafts
    .filter((d) => d.description.trim())
    .map((d, i) => ({
      supplier_id: supplierId,
      description: d.description.trim(),
      price: d.price ? parseFloat(d.price) : null,
      sort_order: i,
    }))
  if (rows.length) {
    await supabase.from('company_event_supplier_addons').insert(rows)
  }
  await supabase
    .from('company_event_supplier_finance')
    .update({ addon_description: null, addon_price: null })
    .eq('supplier_id', supplierId)
}

export async function replaceMarketingItemAddons(itemId: string, drafts: AddonDraft[]) {
  await supabase.from('company_event_marketing_item_addons').delete().eq('item_id', itemId)
  const rows = drafts
    .filter((d) => d.description.trim())
    .map((d, i) => ({
      item_id: itemId,
      description: d.description.trim(),
      price: d.price ? parseFloat(d.price) : null,
      sort_order: i,
    }))
  if (rows.length) {
    await supabase.from('company_event_marketing_item_addons').insert(rows)
  }
  await supabase
    .from('company_event_marketing_item_finance')
    .update({ addon_description: null, addon_price: null })
    .eq('item_id', itemId)
}
