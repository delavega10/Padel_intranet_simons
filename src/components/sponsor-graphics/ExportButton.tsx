import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ExportButton({
  onClick,
  disabled,
  label = 'Eksporter som billede',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled} className="w-full">
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}
