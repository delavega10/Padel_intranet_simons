import type { ExportFormat } from '@/types/sponsorTypes'

export interface FormatOption {
  value: ExportFormat
  label: string
  width: number
  height: number
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'ratio_4_3', label: '4:3', width: 1200, height: 900 },
  { value: 'ratio_16_9', label: '16:9', width: 1200, height: 675 },
]

export function getFormatOption(format: ExportFormat): FormatOption {
  return FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0]
}
