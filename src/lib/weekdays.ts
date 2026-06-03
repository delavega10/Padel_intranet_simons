export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Mandag',
  tuesday: 'Tirsdag',
  wednesday: 'Onsdag',
  thursday: 'Torsdag',
  friday: 'Fredag',
  saturday: 'Lørdag',
  sunday: 'Søndag',
}

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function getTodayWeekday(): Weekday {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()]
}

export function getWeekdayFromDate(dateStr: string): Weekday {
  const d = new Date(`${dateStr}T12:00:00`)
  return JS_DAY_TO_WEEKDAY[d.getDay()]
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export const ROUND_NUMBERS = [1, 2, 3, 4, 5] as const
