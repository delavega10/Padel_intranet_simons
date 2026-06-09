import { Bath, Building2, Coffee, Toilet, type LucideIcon } from 'lucide-react'
import type { DailyTaskArea } from '@/types'

export type { DailyTaskArea }

export const DAILY_TASK_AREAS: DailyTaskArea[] = ['cafe', 'toilet', 'bad', 'hallen']

export const DAILY_TASK_AREA_LABELS: Record<DailyTaskArea, string> = {
  cafe: 'Cafe',
  toilet: 'Toilet',
  bad: 'Bad',
  hallen: 'Hallen',
}

export const DAILY_TASK_AREA_ICONS: Record<DailyTaskArea, LucideIcon> = {
  cafe: Coffee,
  toilet: Toilet,
  bad: Bath,
  hallen: Building2,
}

export const DAILY_TASK_AREA_COLORS: Record<
  DailyTaskArea,
  { border: string; bg: string; icon: string }
> = {
  cafe: { border: 'border-amber-200', bg: 'bg-amber-50/80', icon: 'text-amber-600' },
  toilet: { border: 'border-sky-200', bg: 'bg-sky-50/80', icon: 'text-sky-600' },
  bad: { border: 'border-teal-200', bg: 'bg-teal-50/80', icon: 'text-teal-600' },
  hallen: { border: 'border-padel-200', bg: 'bg-padel-50/80', icon: 'text-padel-600' },
}
