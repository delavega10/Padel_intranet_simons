import {
  Building2,
  CalendarDays,
  Megaphone,
  MonitorSmartphone,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { BenefitItem } from '@/types/sponsorTypes'

const iconMap: Record<string, LucideIcon> = {
  building: Building2,
  monitor: MonitorSmartphone,
  users: Users,
  megaphone: Megaphone,
  target: Target,
  trophy: Trophy,
  calendar: CalendarDays,
}

export function BenefitCard({
  item,
  accentColor,
  onLabelChange,
  compact = false,
}: {
  item: BenefitItem
  accentColor: string
  onLabelChange?: (value: string) => void
  compact?: boolean
}) {
  const Icon = iconMap[item.icon] ?? Target
  const iconClassName = compact ? 'mb-2 h-5 w-5' : 'mb-3 h-7 w-7'
  const textClassName = compact ? 'text-[11px] leading-4' : 'text-sm'
  const paddingClassName = compact ? 'p-3' : 'p-4'

  return (
    <div
      className={`rounded-2xl border bg-black/55 ${paddingClassName}`}
      style={{ borderColor: `${accentColor}77` }}
    >
      <Icon className={iconClassName} style={{ color: accentColor }} />
      {onLabelChange ? (
        <input
          value={item.label}
          onChange={(event) => onLabelChange(event.target.value)}
          className={`w-full rounded bg-transparent font-medium text-white outline-none focus:bg-white/10 whitespace-nowrap overflow-hidden text-ellipsis ${textClassName}`}
        />
      ) : (
        <p className={`truncate font-medium text-white ${textClassName}`}>{item.label}</p>
      )}
    </div>
  )
}
