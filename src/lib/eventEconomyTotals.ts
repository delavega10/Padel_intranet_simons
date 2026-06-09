import { addonsSum } from '@/lib/financeAddons'
import type {
  CompanyEventFinance,
  CompanyEventMarketingItem,
  CompanyEventMarketingItemAddon,
  CompanyEventMarketingItemFinance,
  CompanyEventSupplier,
  CompanyEventSupplierAddon,
  CompanyEventSupplierFinance,
} from '@/types'

function n(v: number | null | undefined): number {
  return v ?? 0
}

function supplierAddonTotal(
  f: CompanyEventSupplierFinance | undefined,
  addons?: CompanyEventSupplierAddon[],
): number {
  if (addons?.length) return addonsSum(addons)
  return n(f?.addon_price)
}

function marketingAddonTotal(
  f: CompanyEventMarketingItemFinance | undefined,
  addons?: CompanyEventMarketingItemAddon[],
): number {
  if (addons?.length) return addonsSum(addons)
  return n(f?.addon_price)
}

export function supplierLineTotal(
  f: CompanyEventSupplierFinance | undefined,
  addons?: CompanyEventSupplierAddon[],
): number {
  if (!f && !addons?.length) return 0
  return n(f?.agreed_price) + supplierAddonTotal(f, addons)
}

export function marketingLineTotal(
  item: CompanyEventMarketingItem,
  f: CompanyEventMarketingItemFinance | undefined,
  addons?: CompanyEventMarketingItemAddon[],
): number {
  if (!f && !addons?.length) return 0
  const base = f?.total_price ?? (f?.unit_price != null ? f.unit_price * item.quantity : 0)
  return n(base) + marketingAddonTotal(f, addons)
}

export interface EventEconomyTotals {
  hostIncome: number
  budget: number
  supplierBase: number
  supplierAddons: number
  supplierTotal: number
  marketingBase: number
  marketingAddons: number
  marketingTotal: number
  grandCostTotal: number
  margin: number
}

export function calcEventEconomyTotals(
  finance: CompanyEventFinance | null,
  suppliers: CompanyEventSupplier[],
  supplierFinance: Record<string, CompanyEventSupplierFinance>,
  supplierAddons: Record<string, CompanyEventSupplierAddon[]>,
  marketingItems: CompanyEventMarketingItem[],
  marketingItemFinance: Record<string, CompanyEventMarketingItemFinance>,
  marketingItemAddons: Record<string, CompanyEventMarketingItemAddon[]>,
): EventEconomyTotals {
  let supplierBase = 0
  let supplierAddonsTotal = 0
  for (const s of suppliers) {
    const f = supplierFinance[s.id]
    const addons = supplierAddons[s.id]
    if (!f && !addons?.length) continue
    supplierBase += n(f?.agreed_price)
    supplierAddonsTotal += supplierAddonTotal(f, addons)
  }

  let marketingBase = 0
  let marketingAddonsTotal = 0
  const activeItems = marketingItems.filter((i) => i.status !== 'annulleret')
  for (const item of activeItems) {
    const f = marketingItemFinance[item.id]
    const addons = marketingItemAddons[item.id]
    if (!f && !addons?.length) continue
    marketingBase += f?.total_price ?? (f?.unit_price != null ? f.unit_price * item.quantity : 0)
    marketingAddonsTotal += marketingAddonTotal(f, addons)
  }

  const supplierTotal = supplierBase + supplierAddonsTotal
  const marketingTotal = marketingBase + marketingAddonsTotal
  const grandCostTotal = supplierTotal + marketingTotal
  const hostIncome = n(finance?.host_agreed_price)
  const budget = n(finance?.total_budget)

  return {
    hostIncome,
    budget,
    supplierBase,
    supplierAddons: supplierAddonsTotal,
    supplierTotal,
    marketingBase,
    marketingAddons: marketingAddonsTotal,
    marketingTotal,
    grandCostTotal,
    margin: hostIncome - grandCostTotal,
  }
}
