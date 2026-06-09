import {
  Building2,
  Coffee,
  Layers,
  ShoppingBag,
  Shirt,
  Sun,
  Toilet,
  type LucideIcon,
} from 'lucide-react'
import type { DailyTaskArea } from '@/types'

export type { DailyTaskArea }

export const DAILY_TASK_AREAS: DailyTaskArea[] = [
  'cafe',
  'omklaedningsrum',
  'toiletter',
  'hallen',
  'sal1',
  'udeareal',
  'shop',
]

export const DAILY_TASK_AREA_LABELS: Record<DailyTaskArea, string> = {
  cafe: 'Cafe',
  omklaedningsrum: 'Omklædningsrum',
  toiletter: 'Toiletter',
  hallen: 'Hallen',
  sal1: '1. sal',
  udeareal: 'Udeareal',
  shop: 'Shop',
}

export const DAILY_TASK_AREA_ICONS: Record<DailyTaskArea, LucideIcon> = {
  cafe: Coffee,
  omklaedningsrum: Shirt,
  toiletter: Toilet,
  hallen: Building2,
  sal1: Layers,
  udeareal: Sun,
  shop: ShoppingBag,
}

export const DAILY_TASK_AREA_COLORS: Record<
  DailyTaskArea,
  { border: string; bg: string; icon: string }
> = {
  cafe: { border: 'border-amber-200', bg: 'bg-amber-50/80', icon: 'text-amber-600' },
  omklaedningsrum: { border: 'border-violet-200', bg: 'bg-violet-50/80', icon: 'text-violet-600' },
  toiletter: { border: 'border-sky-200', bg: 'bg-sky-50/80', icon: 'text-sky-600' },
  hallen: { border: 'border-padel-200', bg: 'bg-padel-50/80', icon: 'text-padel-600' },
  sal1: { border: 'border-orange-200', bg: 'bg-orange-50/80', icon: 'text-orange-600' },
  udeareal: { border: 'border-green-200', bg: 'bg-green-50/80', icon: 'text-green-600' },
  shop: { border: 'border-rose-200', bg: 'bg-rose-50/80', icon: 'text-rose-600' },
}

const LEGACY_AREA_MAP: Record<string, DailyTaskArea> = {
  toilet: 'toiletter',
  bad: 'omklaedningsrum',
}

export function normalizeTaskArea(area: string | null | undefined): DailyTaskArea {
  if (!area) return 'cafe'
  if (area in LEGACY_AREA_MAP) return LEGACY_AREA_MAP[area]
  if ((DAILY_TASK_AREAS as string[]).includes(area)) return area as DailyTaskArea
  return 'cafe'
}
