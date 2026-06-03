export interface LinkPreviewData {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  if (!matches) return []
  return [...new Set(matches.map(normalizeUrl))]
}

export function normalizeUrl(raw: string): string {
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  return url.replace(/[.,;:!?)]+$/, '')
}

export function isValidUrl(raw: string): boolean {
  try {
    const url = new URL(normalizeUrl(raw))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function buildLinkPreviewFallback(url: string): LinkPreviewData {
  try {
    const normalized = normalizeUrl(url)
    const urlObj = new URL(normalized)
    const hostname = urlObj.hostname.replace('www.', '')
    let title = hostname
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0) {
      const last = pathParts[pathParts.length - 1]
      title = last
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]+$/, '')
        .split(' ')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .join(' ')
    }
    return {
      url: normalized,
      title: title || hostname,
      description: `Link til ${hostname}`,
      image: '',
      siteName: hostname,
    }
  } catch {
    return { url, title: url, description: '', image: '', siteName: '' }
  }
}

export async function resolveLinkPreviews(urls: string[]): Promise<LinkPreviewData[]> {
  return urls.map((u) => buildLinkPreviewFallback(u))
}

export function mergeLinkPreviews(
  fromText: string,
  manual: LinkPreviewData[],
): LinkPreviewData[] {
  const textUrls = extractUrls(fromText)
  const all = [...manual, ...textUrls.map(buildLinkPreviewFallback)]
  const seen = new Set<string>()
  return all.filter((p) => {
    if (seen.has(p.url)) return false
    seen.add(p.url)
    return true
  })
}
