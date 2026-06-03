export function formatDate(dateStr: string): string {
  return new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString(
    'da-DK',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
