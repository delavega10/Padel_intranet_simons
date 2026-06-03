/** Eksterne links — sæt i .env (åbnes i ny fane fra sidemenuen) */
export const siteLinks = {
  vagtplan: import.meta.env.VITE_LINK_VAGTPLAN?.trim() ?? '',
  padelplus: import.meta.env.VITE_LINK_PADELPLUS?.trim() ?? '',
  bookingMoedelokale: import.meta.env.VITE_LINK_BOOKING_MOEDELOKALE?.trim() ?? '',
  cafe: import.meta.env.VITE_LINK_CAFE?.trim() ?? '',
  simgolf: import.meta.env.VITE_LINK_SIMGOLF?.trim() ?? '',
} as const

export function isExternalLinkConfigured(url: string): boolean {
  return Boolean(url && url.startsWith('http'))
}
