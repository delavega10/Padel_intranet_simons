import { forwardRef, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { getFormatOption } from '@/components/sponsor-graphics/formatOptions'
import { PriceBox } from '@/components/sponsor-graphics/PriceBox'
import type { ExportFormat, SponsorContent } from '@/types/sponsorTypes'

interface SponsorPreviewProps {
  content: SponsorContent
  format: ExportFormat
  onChangeContent?: (next: SponsorContent) => void
}

export const SponsorPreview = forwardRef<HTMLDivElement, SponsorPreviewProps>(function SponsorPreview(
  { content, format, onChangeContent },
  ref,
) {
  const mainImageInputRef = useRef<HTMLInputElement | null>(null)
  const thumbnailInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const bulkThumbnailsInputRef = useRef<HTMLInputElement | null>(null)
  const selectedFormat = getFormatOption(format)
  const isWideFormat = format === 'ratio_16_9'
  const backgroundClass =
    content.backgroundStyle === 'solid_black'
      ? 'bg-[#020307]'
      : 'bg-[radial-gradient(circle_at_top_right,_#1b2738_0%,_#0a1017_45%,_#020307_100%)]'

  const uploadedThumbnails = content.thumbnailImages.filter(Boolean).slice(0, 4)
  const hasThumbnails = uploadedThumbnails.length > 0
  const inlineTextClass = 'w-full rounded bg-transparent text-white outline-none focus:bg-white/10'
  const inlineSingleLineClass = `${inlineTextClass} whitespace-nowrap`
  const titleClassName = isWideFormat ? 'text-4xl' : 'text-5xl'
  const subtitleClassName = isWideFormat ? 'text-sm' : 'text-base'
  const sectionTitleClassName = isWideFormat ? 'text-xl' : 'text-2xl'
  const bodyTextClassName = isWideFormat ? 'text-xs leading-5' : 'text-sm leading-6'
  const ctaClassName = isWideFormat ? 'text-base' : 'text-lg'
  const wrapperPaddingClassName = isWideFormat ? 'p-5' : 'p-7'
  const leftGapClassName = isWideFormat ? 'gap-3' : 'gap-4'

  function updateField<K extends keyof SponsorContent>(key: K, value: SponsorContent[K]) {
    onChangeContent?.({ ...content, [key]: value })
  }

  function toSingleLine(value: string): string {
    return value.replace(/\s*\n+\s*/g, ' ')
  }

  function fitFontSize(text: string, baseRem: number, minRem: number, threshold: number): string {
    const overflowChars = Math.max(0, text.trim().length - threshold)
    const step = 0.1
    const size = Math.max(minRem, baseRem - overflowChars * step)
    return `${size}rem`
  }

  const titleFontSize = fitFontSize(content.title, isWideFormat ? 2.8 : 3.2, isWideFormat ? 1.8 : 2.1, 10)
  const subtitleFontSize = fitFontSize(content.subtitle, isWideFormat ? 0.9 : 1, 0.75, 48)

  function updateIncludedItem(index: number, value: string) {
    const nextItems = [...content.includedItems]
    nextItems[index] = value
    updateField('includedItems', nextItems)
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Kunne ikke læse billedfilen'))
      reader.readAsDataURL(file)
    })
  }

  async function handleMainImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    updateField('mainImage', dataUrl)
    event.target.value = ''
  }

  async function handleThumbnailUpload(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    const nextThumbnails = [...content.thumbnailImages]
    nextThumbnails[index] = dataUrl
    updateField('thumbnailImages', nextThumbnails.filter(Boolean).slice(0, 4))
    event.target.value = ''
  }

  async function handleBulkThumbnailUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const uploaded = await Promise.all(files.slice(0, 4).map((file) => fileToDataUrl(file)))
    const existing = content.thumbnailImages.filter(Boolean)
    const merged = [...existing, ...uploaded].slice(0, 4)

    updateField('thumbnailImages', merged)
    event.target.value = ''
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border border-white/10 ${backgroundClass}`}
      style={{ width: '100%', aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3)_0%,_rgba(0,0,0,0)_45%)]" />

      <div className={`relative z-10 grid h-full grid-cols-12 text-white ${leftGapClassName} ${wrapperPaddingClassName}`}>
        <div className="col-span-5 flex flex-col">
          <div className={isWideFormat ? 'mb-3' : 'mb-4'}>
            <Logo className={isWideFormat ? 'h-8 w-auto' : 'h-10 w-auto'} />
          </div>

          <input
            value={content.title}
            onChange={(event) => updateField('title', toSingleLine(event.target.value))}
            onBlur={(event) => {
              event.currentTarget.scrollLeft = 0
            }}
            className={`${titleClassName} font-extrabold leading-[0.9] tracking-tight ${inlineSingleLineClass}`}
            style={{ color: content.accentColor, fontSize: titleFontSize }}
          />

          <input
            value={content.subtitle}
            onChange={(event) => updateField('subtitle', toSingleLine(event.target.value))}
            onBlur={(event) => {
              event.currentTarget.scrollLeft = 0
            }}
            className={`mt-3 max-w-xl text-white/85 ${subtitleClassName} ${inlineSingleLineClass}`}
            style={{ fontSize: subtitleFontSize }}
          />

          <div className={isWideFormat ? 'mt-3' : 'mt-5'}>
            <PriceBox
              price={content.price}
              priceLabel={content.priceLabel}
              valueLine={content.valueLine}
              accentColor={content.accentColor}
              onPriceChange={(value) => updateField('price', value)}
              onPriceLabelChange={(value) => updateField('priceLabel', toSingleLine(value))}
              onValueLineChange={(value) => updateField('valueLine', toSingleLine(value))}
              compact={isWideFormat}
            />
          </div>

          <div className={isWideFormat ? 'mt-3 grid grid-cols-2 gap-3' : 'mt-5 grid grid-cols-2 gap-5'}>
            <div>
              <h3
                className={`${sectionTitleClassName} truncate font-bold whitespace-nowrap`}
                style={{ color: content.accentColor }}
              >
                Det får I:
              </h3>
              <ul className={`mt-2 space-y-1.5 text-white/90 ${bodyTextClassName}`}>
                {content.includedItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <CheckCircle2
                      className={isWideFormat ? 'mt-0.5 h-3.5 w-3.5 shrink-0' : 'mt-0.5 h-4 w-4 shrink-0'}
                      style={{ color: content.accentColor }}
                    />
                    <input
                      value={item}
                      onChange={(event) => updateIncludedItem(index, event.target.value)}
                      className={`flex-1 ${bodyTextClassName} ${inlineSingleLineClass}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3
                className={`${sectionTitleClassName} truncate font-bold whitespace-nowrap`}
                style={{ color: content.accentColor }}
              >
                Hvem passer den til?
              </h3>
              <textarea
                value={content.targetAudience}
                onChange={(event) => updateField('targetAudience', event.target.value)}
                className={`mt-2 w-full resize-none text-white/90 ${bodyTextClassName} ${inlineTextClass}`}
                rows={isWideFormat ? 3 : 4}
              />
            </div>
          </div>

          <div className="mt-auto">
            <div className="rounded-xl border px-5 py-3" style={{ borderColor: `${content.accentColor}bb` }}>
              <input
                value={content.ctaText}
                onChange={(event) => updateField('ctaText', toSingleLine(event.target.value))}
                className={`text-left font-semibold ${ctaClassName} ${inlineSingleLineClass}`}
              />
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col">
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 ${
              hasThumbnails
                ? isWideFormat
                  ? 'h-[68%]'
                  : 'h-[72%]'
                : 'min-h-0 flex-1'
            }`}
          >
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMainImageUpload}
            />
            {content.mainImage ? (
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="h-full w-full cursor-pointer"
                title="Klik for at skifte hovedbillede"
              >
                <img src={content.mainImage} alt="Hovedbillede" className="h-full w-full object-cover" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="flex h-full w-full items-center justify-center text-lg font-medium text-white/65"
              >
                Upload et hovedbillede af hallen
              </button>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,0.08)_0%,_rgba(0,0,0,0.62)_100%)]" />
          </div>

          {hasThumbnails && (
            <div className="mt-2">
              <input
                ref={bulkThumbnailsInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBulkThumbnailUpload}
              />

              <div className={`grid gap-3 ${isWideFormat ? 'h-[24%]' : 'h-[22%]'}`} style={{ gridTemplateColumns: `repeat(${uploadedThumbnails.length}, minmax(0, 1fr))` }}>
                {uploadedThumbnails.map((thumbnail, index) => (
                  <button
                    key={`thumb-${index}`}
                    type="button"
                    onClick={() => thumbnailInputRefs.current[index]?.click()}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 text-left"
                    title={`Skift preview ${index + 1}`}
                  >
                    <input
                      ref={(element) => {
                        thumbnailInputRefs.current[index] = element
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleThumbnailUpload(index, event)}
                    />
                    <img
                      src={thumbnail}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-contain bg-black/60"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
