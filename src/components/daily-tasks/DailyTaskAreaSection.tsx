import { Check, Trash2 } from 'lucide-react'
import {
  DAILY_TASK_AREA_COLORS,
  DAILY_TASK_AREA_ICONS,
  DAILY_TASK_AREA_LABELS,
  type DailyTaskArea,
} from '@/lib/dailyTaskAreas'
import { formatDate } from '@/lib/format'
import type { DailyTask, DailyTaskCompletion } from '@/types'

interface DailyTaskAreaSectionProps {
  area: DailyTaskArea
  tasks: DailyTask[]
  completions: DailyTaskCompletion[]
  completedIds: Set<string>
  isAdmin: boolean
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export function DailyTaskAreaSection({
  area,
  tasks,
  completions,
  completedIds,
  isAdmin,
  onToggle,
  onDelete,
}: DailyTaskAreaSectionProps) {
  const colors = DAILY_TASK_AREA_COLORS[area]
  const Icon = DAILY_TASK_AREA_ICONS[area]
  const done = tasks.filter((t) => completedIds.has(t.id)).length

  return (
    <section className={`content-card border-2 ${colors.border} ${colors.bg}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900 normal-case">
          <Icon className={`h-5 w-5 shrink-0 ${colors.icon}`} />
          {DAILY_TASK_AREA_LABELS[area]}
        </h3>
        {tasks.length > 0 && (
          <span className="shrink-0 text-sm text-gray-500">
            {done}/{tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isAdmin ? 'Ingen opgaver i dette område endnu.' : 'Ingen opgaver planlagt.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const isDone = completedIds.has(task.id)
            const completion = completions.find((c) => c.task_id === task.id)
            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 rounded-lg border bg-white p-3 transition-colors ${
                  isDone ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  disabled={isDone && !isAdmin}
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 shadow-sm transition-colors ${
                    isDone
                      ? 'border-green-600 bg-green-500 text-white ring-2 ring-green-300'
                      : 'border-red-500 bg-red-100 ring-2 ring-red-300 hover:bg-red-200 hover:ring-red-400'
                  } ${isDone && !isAdmin ? 'cursor-default' : ''}`}
                  aria-label={
                    isDone ? (isAdmin ? 'Fjern afkrydsning' : 'Udført') : 'Marker udført'
                  }
                >
                  {isDone && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isDone ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </p>
                  {isDone && completion && (
                    <p className="mt-1 text-xs text-gray-500">
                      Afkrydset {formatDate(completion.completed_at.slice(0, 10))}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Slet opgave"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
