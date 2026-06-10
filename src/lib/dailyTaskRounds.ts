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

/** Semantiske klasser med eksplicit lys/mørk styling i index.css */
export const DAILY_ROUND_COLORS: Record<
  DailyRoundNumber,
  { box: string; header: string }
> = {
  1: { box: 'daily-round daily-round-1', header: 'daily-round-header daily-round-header-1' },
  2: { box: 'daily-round daily-round-2', header: 'daily-round-header daily-round-header-2' },
  3: { box: 'daily-round daily-round-3', header: 'daily-round-header daily-round-header-3' },
  4: { box: 'daily-round daily-round-4', header: 'daily-round-header daily-round-header-4' },
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
