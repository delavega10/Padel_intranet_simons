import { Settings2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { CollapsibleBox } from '@/components/sponsor-graphics/CollapsibleBox'
import { FormatSelector } from '@/components/sponsor-graphics/FormatSelector'
import { ImageUploader } from '@/components/sponsor-graphics/ImageUploader'
import type { ExportFormat, SponsorContent } from '@/types/sponsorTypes'

export function EditorPanel({
  content,
  format,
  onChangeContent,
  onChangeFormat,
}: {
  content: SponsorContent
  format: ExportFormat
  onChangeContent: (next: SponsorContent) => void
  onChangeFormat: (next: ExportFormat) => void
}) {
  function updateField<K extends keyof SponsorContent>(key: K, value: SponsorContent[K]) {
    onChangeContent({ ...content, [key]: value })
  }

  function updateThumbnails(index: number, image: string | null) {
    const next = [...content.thumbnailImages]
    if (image) {
      next[index] = image
      updateField('thumbnailImages', next.filter(Boolean).slice(0, 4))
      return
    }
    updateField(
      'thumbnailImages',
      next.filter((_, itemIndex) => itemIndex !== index).filter(Boolean).slice(0, 4),
    )
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Kunne ikke læse billedfilen'))
      reader.readAsDataURL(file)
    })
  }

  async function handleBulkThumbnailsUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const uploaded = await Promise.all(files.slice(0, 4).map((file) => fileToDataUrl(file)))
    const existing = content.thumbnailImages.filter(Boolean)
    const merged = [...existing, ...uploaded].slice(0, 4)

    updateField('thumbnailImages', merged)
    event.target.value = ''
  }

  const uploadedThumbnails = content.thumbnailImages
    .map((image, index) => ({ image, index }))
    .filter((entry): entry is { image: string; index: number } => Boolean(entry.image))
    .slice(0, 4)

  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-padel-700" />
        <h2 className="text-sm font-semibold text-gray-900">Design indstillinger</h2>
      </div>

      <CollapsibleBox title="Format">
        <FormatSelector value={format} onChange={onChangeFormat} />
      </CollapsibleBox>

      <CollapsibleBox title="Direkte redigering">
        <p className="text-sm text-gray-600">
          Klik direkte i previewet for at redigere overskrifter, pris, lister og CTA.
        </p>
      </CollapsibleBox>

      <CollapsibleBox title="Billeder">
        <ImageUploader
          label="Hovedbillede"
          image={content.mainImage}
          onChange={(image) => updateField('mainImage', image)}
          onRemove={() => updateField('mainImage', null)}
        />
        {uploadedThumbnails.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {uploadedThumbnails.map(({ image, index }) => (
              <ImageUploader
                key={`thumb-${index}`}
                label={`Preview ${index + 1}`}
                image={image}
                onChange={(nextImage) => updateThumbnails(index, nextImage)}
                onRemove={() => updateThumbnails(index, null)}
              />
            ))}
          </div>
        )}
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          {uploadedThumbnails.length > 0 ? 'Tilføj flere previews (bulk)' : 'Upload previews (bulk)'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBulkThumbnailsUpload}
          />
        </label>
      </CollapsibleBox>

      <CollapsibleBox title="Stil">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Accent farve</label>
          <input
            type="color"
            value={content.accentColor}
            onChange={(event) => updateField('accentColor', event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 py-1"
          />
        </div>
        <Select
          label="Baggrundsstil"
          value={content.backgroundStyle}
          onChange={(event) => updateField('backgroundStyle', event.target.value as SponsorContent['backgroundStyle'])}
        >
          <option value="charcoal_gradient">Charcoal gradient</option>
          <option value="solid_black">Solid black</option>
        </Select>
      </CollapsibleBox>
    </aside>
  )
}
