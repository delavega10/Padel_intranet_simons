import { Select } from '@/components/ui/Select'
import { FORMAT_OPTIONS } from '@/components/sponsor-graphics/formatOptions'
import type { ExportFormat } from '@/types/sponsorTypes'

export function FormatSelector({
  value,
  onChange,
}: {
  value: ExportFormat
  onChange: (next: ExportFormat) => void
}) {
  return (
    <Select
      label="Format"
      value={value}
      onChange={(event) => onChange(event.target.value as ExportFormat)}
    >
      {FORMAT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
