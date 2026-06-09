import { formatCurrency } from '@/lib/format'
import type { LunaCaptain, LunaPlayerSetOffer } from '@/types'

export function buildLunaPlayerSetOfferMail(
  captain: LunaCaptain,
  offer: LunaPlayerSetOffer,
): string {
  const lines: string[] = []
  const greeting = captain.name ? `Kære ${captain.name}` : 'Kære kaptajn'

  lines.push(greeting)
  lines.push('')
  lines.push('Tak for jeres deltagelse i LunaLiga hos Simons Padel Club.')
  lines.push('')
  lines.push('Vi sender hermed et tilbud på spillersæt til jeres hold:')
  lines.push('')
  lines.push('──────────────────────────────')
  lines.push(offer.set_name.trim() || 'Spillersæt')

  if (offer.quantity != null && offer.quantity > 0) {
    lines.push(`Antal: ${offer.quantity} stk.`)
  }
  if (offer.price != null) {
    lines.push(`Pris: ${formatCurrency(offer.price)}`)
  }
  if (offer.included_description?.trim()) {
    lines.push('')
    lines.push('Inkluderet i sættet:')
    lines.push(offer.included_description.trim())
  }

  if (captain.team) {
    lines.push('')
    lines.push(`Hold: ${captain.team}`)
  }

  lines.push('──────────────────────────────')
  lines.push('')
  lines.push('Sig endelig til, hvis I ønsker at bestille — eller hvis I har spørgsmål.')
  lines.push('')
  lines.push('Venlig hilsen')
  lines.push('Simons Padel Club')
  lines.push('info@simonspadel.dk | simonspadel.dk')

  return lines.join('\n')
}
