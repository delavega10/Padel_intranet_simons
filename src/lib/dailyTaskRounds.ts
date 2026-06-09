import type { DailyTask } from '@/types'

export const SHIFT_ROUND_NUMBERS = [1, 2, 3] as const
export const LUKKE_ROUND_NUMBER = 4

export type ShiftRoundNumber = (typeof SHIFT_ROUND_NUMBERS)[number]
export type DailyRoundNumber = ShiftRoundNumber | typeof LUKKE_ROUND_NUMBER

export const DAILY_ROUND_NUMBERS: DailyRoundNumber[] = [1, 2, 3, LUKKE_ROUND_NUMBER]

export const DAILY_ROUND_LABELS: Record<DailyRoundNumber, string> = {
  1: 'Runde 1',
  2: 'Runde 2',
  3: 'Runde 3',
  4: 'Lukkerunde',
}

export const DAILY_ROUND_COLORS: Record<
  DailyRoundNumber,
  { border: string; bg: string; header: string }
> = {
  1: { border: 'border-padel-200', bg: 'bg-padel-50/60', header: 'text-padel-700' },
  2: { border: 'border-padel-300', bg: 'bg-padel-50/80', header: 'text-padel-800' },
  3: { border: 'border-padel-400', bg: 'bg-padel-100/50', header: 'text-padel-900' },
  4: { border: 'border-indigo-200', bg: 'bg-indigo-50/80', header: 'text-indigo-800' },
}

/** Opgave tilhører en vagtrunde (1–3) eller lukkerunden (4). */
export function taskRoundNumber(task: DailyTask): DailyRoundNumber {
  if (task.round_number === LUKKE_ROUND_NUMBER) {
    return LUKKE_ROUND_NUMBER
  }
  const n = task.round_number
  if (n >= 1 && n <= 3) return n as ShiftRoundNumber
  return 1
}

export function tasksForRound(dayTasks: DailyTask[], round: DailyRoundNumber): DailyTask[] {
  return dayTasks.filter((t) => taskRoundNumber(t) === round)
}

export function isRoundComplete(
  dayTasks: DailyTask[],
  round: DailyRoundNumber,
  completedIds: Set<string>,
): boolean {
  const roundTasks = tasksForRound(dayTasks, round)
  if (roundTasks.length === 0) return false
  return roundTasks.every((t) => completedIds.has(t.id))
}

/** Alle tidligere runder med opgaver skal være afkrydset (tomme runder springes over). */
export function isRoundUnlocked(
  dayTasks: DailyTask[],
  round: DailyRoundNumber,
  completedIds: Set<string>,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true
  if (round === 1) return true

  for (let r = 1; r < round; r++) {
    const prevRound = r as DailyRoundNumber
    const prevTasks = tasksForRound(dayTasks, prevRound)
    if (prevTasks.length === 0) continue
    if (!prevTasks.every((t) => completedIds.has(t.id))) return false
  }
  return true
}

/** Første runde medarbejderen skal arbejde i (låst op, men ikke færdig). */
export function activeEmployeeRound(
  dayTasks: DailyTask[],
  completedIds: Set<string>,
): DailyRoundNumber | null {
  for (const round of DAILY_ROUND_NUMBERS) {
    if (!isRoundUnlocked(dayTasks, round, completedIds, false)) return null
    if (!isRoundComplete(dayTasks, round, completedIds)) return round
  }
  return null
}

export function previousRound(round: DailyRoundNumber): DailyRoundNumber | null {
  if (round === 1) return null
  return (round - 1) as DailyRoundNumber
}
