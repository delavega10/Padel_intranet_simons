import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { emptyAddonDraft, type AddonDraft } from '@/lib/financeAddons'

interface AddonListEditorProps {
  addons: AddonDraft[]
  onChange: (addons: AddonDraft[]) => void
}

export function AddonListEditor({ addons, onChange }: AddonListEditorProps) {
  const rows = addons.length > 0 ? addons : [emptyAddonDraft()]

  function updateRow(index: number, patch: Partial<AddonDraft>) {
    const next = [...rows]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [emptyAddonDraft()])
  }

  function addRow() {
    onChange([...rows, emptyAddonDraft()])
  }

  return (
    <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/30 p-3 space-y-2">
      <p className="text-xs font-medium text-amber-800">Tilkøb (add-ons)</p>
      {rows.map((row, index) => (
        <div key={row.id ?? index} className="flex flex-col sm:flex-row gap-2 items-start">
          <Input
            label={index === 0 ? 'Beskrivelse' : undefined}
            value={row.description}
            onChange={(e) => updateRow(index, { description: e.target.value })}
            placeholder="Fx ekstra dessert, flere flasker..."
            className="flex-1"
          />
          <Input
            label={index === 0 ? 'Pris (DKK)' : undefined}
            type="number"
            step="0.01"
            value={row.price}
            onChange={(e) => updateRow(index, { price: e.target.value })}
            className="w-full sm:w-32"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className={`rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 ${index === 0 ? 'mt-6' : ''}`}
            aria-label="Fjern tilkøb"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" className="text-xs" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Tilføj tilkøb
      </Button>
    </div>
  )
}
