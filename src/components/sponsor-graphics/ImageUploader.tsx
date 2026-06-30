import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Kunne ikke læse filen'))
    reader.readAsDataURL(file)
  })
}

export function ImageUploader({
  label,
  image,
  onChange,
  onRemove,
}: {
  label: string
  image: string | null
  onChange: (dataUrl: string) => void
  onRemove?: () => void
}) {
  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    onChange(dataUrl)
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
        <ImagePlus className="h-4 w-4" />
        Upload billede
        <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </label>

      {image && (
        <div className="space-y-2 rounded-lg border border-gray-200 p-2">
          <img src={image} alt={label} className="h-24 w-full rounded-md object-cover" />
          {onRemove && (
            <Button type="button" variant="ghost" onClick={onRemove} className="w-full">
              <Trash2 className="h-4 w-4" />
              Fjern billede
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
