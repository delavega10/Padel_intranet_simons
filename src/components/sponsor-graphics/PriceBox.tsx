export function PriceBox({
  price,
  priceLabel,
  valueLine,
  accentColor,
  onPriceChange,
  onPriceLabelChange,
  onValueLineChange,
  compact = false,
}: {
  price: string
  priceLabel: string
  valueLine: string
  accentColor: string
  onPriceChange?: (value: string) => void
  onPriceLabelChange?: (value: string) => void
  onValueLineChange?: (value: string) => void
  compact?: boolean
}) {
  const priceClassName = compact ? 'text-4xl' : 'text-5xl'
  const labelClassName = compact ? 'text-2xl' : 'text-3xl'
  const valueLineClassName = compact ? 'text-sm' : 'text-base'
  const rootPaddingClassName = compact ? 'p-4' : 'p-5'

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm ${rootPaddingClassName}`}
      style={{ borderColor: `${accentColor}aa` }}
    >
      <div className="flex flex-nowrap items-end gap-2 overflow-hidden">
        {onPriceChange ? (
          <input
            value={price}
            onChange={(event) => onPriceChange(event.target.value)}
            className={`min-w-0 flex-1 whitespace-nowrap bg-transparent font-extrabold leading-none outline-none text-ellipsis ${priceClassName}`}
            style={{ color: accentColor }}
          />
        ) : (
          <p
            className={`${priceClassName} min-w-0 flex-1 truncate whitespace-nowrap font-extrabold leading-none`}
            style={{ color: accentColor }}
          >
            {price}
          </p>
        )}
        {onPriceLabelChange ? (
          <input
            value={priceLabel}
            onChange={(event) => onPriceLabelChange(event.target.value)}
            className={`w-20 shrink-0 whitespace-nowrap bg-transparent pb-1 font-semibold text-white outline-none ${labelClassName}`}
          />
        ) : (
          <p className={`w-20 shrink-0 whitespace-nowrap pb-1 font-semibold text-white ${labelClassName}`}>
            {priceLabel}
          </p>
        )}
      </div>
      {onValueLineChange ? (
        <input
          value={valueLine}
          onChange={(event) => onValueLineChange(event.target.value)}
          className={`mt-3 w-full bg-transparent text-white/90 outline-none focus:bg-white/10 ${valueLineClassName}`}
        />
      ) : (
        <p className={`mt-3 text-white/90 ${valueLineClassName}`}>{valueLine}</p>
      )}
    </div>
  )
}
