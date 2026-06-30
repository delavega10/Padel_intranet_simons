import { PLACEMENT_OPTIONS } from '@/data/sponsorTemplates'
import type { SponsorContent } from '@/types/sponsorTypes'

export function SponsorOverlay({
  content,
  onSponsorNameChange,
  onPlacementTextChange,
}: {
  content: SponsorContent
  onSponsorNameChange?: (value: string) => void
  onPlacementTextChange?: (value: string) => void
}) {
  const option = PLACEMENT_OPTIONS[content.sponsorPlacement]
  const hasLogo = Boolean(content.sponsorLogo)

  return (
    <>
      <div
        className={`absolute overflow-hidden rounded-lg border border-dashed bg-black/45 p-2 ${option.overlayPosition.anchorClassName}`}
        style={{ borderColor: `${content.accentColor}bb` }}
      >
        {hasLogo ? (
          <img src={content.sponsorLogo!} alt={content.sponsorName} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {onSponsorNameChange ? (
              <input
                value={content.sponsorName}
                onChange={(event) => onSponsorNameChange(event.target.value)}
                className="w-full bg-transparent text-center text-xs font-semibold uppercase tracking-wide text-white outline-none"
              />
            ) : (
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-white">
                {content.sponsorName}
              </p>
            )}
          </div>
        )}
      </div>

      <div className={`absolute ${option.overlayPosition.calloutClassName}`}>
        <div
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-white"
          style={{ borderColor: `${content.accentColor}cc`, backgroundColor: '#030609cc' }}
        >
          {onPlacementTextChange ? (
            <input
              value={content.sponsorPlacementText}
              onChange={(event) => onPlacementTextChange(event.target.value)}
              className="w-44 bg-transparent outline-none"
            />
          ) : (
            content.sponsorPlacementText
          )}
        </div>
        <div className="mt-1 h-7 w-px" style={{ backgroundColor: content.accentColor }} />
      </div>
    </>
  )
}
