import { formatDate, formatEventCourts, formatTime } from '@/lib/format'
import {
  EVENT_SUPPLIER_CATEGORY_LABELS,
  MARKETING_PRODUCT_LABELS,
  type CompanyEvent,
  type CompanyEventMarketing,
  type CompanyEventMarketingItem,
  type CompanyEventMarketingItemAddon,
  type CompanyEventMarketingItemFinance,
  type CompanyEventSupplier,
  type CompanyEventSupplierAddon,
  type CompanyEventSupplierFinance,
  type EventSupplierCategory,
} from '@/types'

const supplierCategoryOrder: EventSupplierCategory[] = ['mad', 'drikke', 'praemier', 'andet']

export interface EventCustomerSummaryData {
  event: CompanyEvent
  marketing: CompanyEventMarketing | null
  marketingItems: CompanyEventMarketingItem[]
  suppliers: CompanyEventSupplier[]
  supplierFinance?: Record<string, CompanyEventSupplierFinance>
  supplierAddons?: Record<string, CompanyEventSupplierAddon[]>
  marketingItemFinance?: Record<string, CompanyEventMarketingItemFinance>
  marketingItemAddons?: Record<string, CompanyEventMarketingItemAddon[]>
}

function appendSupplierSection(
  lines: string[],
  category: EventSupplierCategory,
  suppliers: CompanyEventSupplier[],
  supplierFinance: Record<string, CompanyEventSupplierFinance>,
  supplierAddons: Record<string, CompanyEventSupplierAddon[]>,
) {
  const items = suppliers.filter((s) => s.category === category)
  if (items.length === 0) return

  lines.push(EVENT_SUPPLIER_CATEGORY_LABELS[category].toUpperCase())
  for (const s of items) {
    lines.push(`• ${s.name}`)
    if (s.description) lines.push(`  ${s.description}`)
    const finance = supplierFinance[s.id]
    if (finance?.included_description) {
      lines.push(`  Inkluderet: ${finance.included_description}`)
    }
    const addons = supplierAddons[s.id]
    if (addons?.length) {
      for (const a of addons) {
        lines.push(`  Tilkøb: ${a.description}`)
      }
    } else if (finance?.addon_description) {
      lines.push(`  Tilkøb: ${finance.addon_description}`)
    }
    if (finance?.on_site_from) {
      const from = formatTime(finance.on_site_from)
      const to = finance.on_site_to ? formatTime(finance.on_site_to) : null
      lines.push(`  På stedet: ${from}${to ? ` – ${to}` : ''}`)
    }
    if (s.notes) lines.push(`  Note: ${s.notes}`)
  }
  lines.push('')
}

function appendMarketingSection(
  lines: string[],
  marketingItems: CompanyEventMarketingItem[],
  marketingItemFinance: Record<string, CompanyEventMarketingItemFinance>,
  marketingItemAddons: Record<string, CompanyEventMarketingItemAddon[]>,
) {
  const active = marketingItems.filter((i) => i.status !== 'annulleret')
  if (active.length === 0) return

  lines.push('MARKETING & TILBEHØR')
  for (const item of active) {
    const pkg = item.package_name ? ` (${item.package_name})` : ''
    lines.push(
      `• ${MARKETING_PRODUCT_LABELS[item.product_type]}: ${item.item_name}${pkg} — ${item.quantity} stk.`,
    )
    const specs = [
      item.size_specs && `Størrelse: ${item.size_specs}`,
      item.material && `Materiale: ${item.material}`,
      item.color_specs && `Farver: ${item.color_specs}`,
    ].filter(Boolean)
    for (const spec of specs) lines.push(`  ${spec}`)

    const finance = marketingItemFinance[item.id]
    if (finance?.included_description) {
      lines.push(`  Inkluderet: ${finance.included_description}`)
    }
    const addons = marketingItemAddons[item.id]
    if (addons?.length) {
      for (const a of addons) {
        lines.push(`  Tilkøb: ${a.description}`)
      }
    } else if (finance?.addon_description) {
      lines.push(`  Tilkøb: ${finance.addon_description}`)
    }
    if (item.expected_delivery) {
      lines.push(`  Forventet levering: ${formatDate(item.expected_delivery)}`)
    }
  }
  lines.push('')
}

/** Kunde-venlig oversigt over indhold — uden priser, til kopier/mail */
export function buildEventCustomerSummary(data: EventCustomerSummaryData): string {
  const {
    event,
    marketing,
    marketingItems,
    suppliers,
    supplierFinance = {},
    supplierAddons = {},
    marketingItemFinance = {},
    marketingItemAddons = {},
  } = data

  const lines: string[] = []
  const greeting = event.host_contact_name
    ? `Kære ${event.host_contact_name}`
    : event.host_company
      ? `Kære ${event.host_company}`
      : 'Kære gæst'

  lines.push(greeting)
  lines.push('')
  lines.push('Her er en oversigt over, hvad der er med i jeres event hos Simons Padel Club:')
  lines.push('')
  lines.push('──────────────────────────────')

  lines.push(`Event: ${event.title}`)
  lines.push(
    `Dato: ${formatDate(event.event_date)}${event.event_time ? ` kl. ${formatTime(event.event_time)}` : ''}`,
  )
  lines.push('Sted: Simons Padel Club, Kromosevej 7, 3050 Humlebæk')
  if (event.host_company) lines.push(`Firma: ${event.host_company}`)
  lines.push('')

  lines.push('BANER')
  const courts = formatEventCourts(event.whole_hall, event.court_count)
  if (courts) {
    lines.push(`• ${courts}`)
  } else {
    lines.push('• Baner aftales med klubben')
  }
  if (event.matchi_booked) {
    const nums = [...(event.booked_court_numbers ?? [])].sort((a, b) => a - b)
    lines.push(
      nums.length > 0
        ? `• Bookede baner: ${nums.map((n) => `bane ${n}`).join(', ')}`
        : '• Baner er reserveret i Matchi',
    )
  }
  lines.push('')

  if (event.description) {
    lines.push('OM EVENTET')
    lines.push(event.description)
    lines.push('')
  }

  const hasSuppliers = suppliers.length > 0
  if (hasSuppliers) {
    lines.push('LEVERANDØRER & INDLÆG')
    lines.push('')
    for (const cat of supplierCategoryOrder) {
      appendSupplierSection(lines, cat, suppliers, supplierFinance, supplierAddons)
    }
  }

  appendMarketingSection(lines, marketingItems, marketingItemFinance, marketingItemAddons)

  if (marketing?.logo_url) {
    lines.push('LOGO & DESIGN')
    lines.push('• Jeres logo er modtaget og klar til produktion.')
    if (marketing.brand_colors) lines.push(`• Brandfarver: ${marketing.brand_colors}`)
    if (marketing.logo_placement_notes) {
      lines.push(`• Placering: ${marketing.logo_placement_notes}`)
    }
    if (marketing.design_approved) {
      lines.push(
        `• Design godkendt${marketing.design_approved_by ? ` af ${marketing.design_approved_by}` : ''}.`,
      )
    }
    lines.push('')
  }

  lines.push('──────────────────────────────')
  lines.push('')
  lines.push('Har I spørgsmål eller ønsker til ændringer, så skriv endelig.')
  lines.push('')
  lines.push('Venlig hilsen')
  lines.push('Simons Padel Club')
  lines.push('info@simonspadel.dk | simonspadel.dk')

  return lines.join('\n')
}
