import { Check, ChevronDown, Lock, Trash2 } from 'lucide-react'
import {
  DAILY_TASK_AREAS,
  DAILY_TASK_AREA_COLORS,
  DAILY_TASK_AREA_ICONS,
  DAILY_TASK_AREA_LABELS,
} from '@/lib/dailyTaskAreas'
import { DAILY_ROUND_COLORS, DAILY_ROUND_LABELS, type DailyRoundNumber } from '@/lib/dailyTaskRounds'
import { formatDate } from '@/lib/format'
import type { DailyTask, DailyTaskCompletion } from '@/types'

interface DailyTaskRoundBoxProps {
  round: DailyRoundNumber
  tasks: DailyTask[]
  completions: DailyTaskCompletion[]
  completedIds: Set<string>
  unlocked: boolean
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function TaskRow({
  task,
  isDone,
  completion,
  isAdmin,
  disabled,
  onToggle,
  onDelete,
}: {
  task: DailyTask
  isDone: boolean
  completion?: DailyTaskCompletion
  isAdmin: boolean
  disabled: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <li
      className={`daily-task-row ${isDone ? 'daily-task-row--done' : 'daily-task-row--open'} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || (isDone && !isAdmin)}
        className={`daily-task-check mt-0.5 ${
          isDone ? 'daily-task-check--done' : 'daily-task-check--open'
        } ${isDone && !isAdmin ? 'cursor-default' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
        aria-label={isDone ? (isAdmin ? 'Fjern afkrydsning' : 'Udført') : 'Marker udført'}
      >
        {isDone && <Check className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            isDone ? 'daily-task-title--done' : 'daily-task-title'
          }`}
        >
          {task.title}
        </p>
        {isDone && completion && (
          <p className="daily-task-meta mt-1 text-xs">
            Afkrydset {formatDate(completion.completed_at.slice(0, 10))}
          </p>
        )}
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Slet opgave"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </li>
  )
}

export function DailyTaskRoundBox({
  round,
  tasks,
  completions,
  completedIds,
  unlocked,
  isAdmin,
  open,
  onOpenChange,
  onToggleTask,
  onDeleteTask,
}: DailyTaskRoundBoxProps) {
  const colors = DAILY_ROUND_COLORS[round]
  const done = tasks.filter((t) => completedIds.has(t.id)).length
  const canExpand = isAdmin ? true : unlocked

  return (
    <section
      className={`${colors.box} ${!canExpand && !isAdmin ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={() => {
          if (!canExpand) return
          onOpenChange(!open)
        }}
        disabled={!canExpand}
        className={`daily-round-toggle flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${
          canExpand ? '' : 'cursor-not-allowed'
        }`}
        aria-expanded={open && canExpand}
      >
        <ChevronDown
          className={`daily-round-chevron h-5 w-5 shrink-0 transition-transform ${
            open && canExpand ? 'rotate-180' : ''
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className={colors.header}>{DAILY_ROUND_LABELS[round]}</p>
          {!unlocked && !isAdmin && (
            <p className="daily-round-hint mt-0.5 flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3" />
              Afkryds alle opgaver i forrige runde først
            </p>
          )}
        </div>
        {tasks.length > 0 && (
          <span
            className={`daily-round-badge ${
              done === tasks.length
                ? 'daily-round-badge--complete'
                : 'daily-round-badge--progress'
            }`}
          >
            {done}/{tasks.length}
          </span>
        )}
        {!unlocked && !isAdmin && <Lock className="daily-round-chevron h-4 w-4 shrink-0" />}
      </button>

      {open && canExpand && (
        <div className="daily-round-body space-y-4 px-4 pb-4 pt-2">
          {tasks.length === 0 ? (
            <p className="daily-round-hint text-sm py-2">
              {isAdmin ? 'Ingen opgaver i denne runde endnu.' : 'Ingen opgaver planlagt.'}
            </p>
          ) : (
            DAILY_TASK_AREAS.map((area) => {
              const areaTasks = tasks.filter((t) => t.area === area)
              if (areaTasks.length === 0) return null
              const areaColors = DAILY_TASK_AREA_COLORS[area]
              const AreaIcon = DAILY_TASK_AREA_ICONS[area]
              return (
                <div key={area}>
                  <h4
                    className={`mb-2 flex items-center gap-1.5 text-sm font-semibold normal-case ${areaColors.icon}`}
                  >
                    <AreaIcon className="h-4 w-4" />
                    {DAILY_TASK_AREA_LABELS[area]}
                  </h4>
                  <ul className="space-y-2">
                    {areaTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isDone={completedIds.has(task.id)}
                        completion={completions.find((c) => c.task_id === task.id)}
                        isAdmin={isAdmin}
                        disabled={false}
                        onToggle={() => onToggleTask(task.id)}
                        onDelete={() => onDeleteTask(task.id)}
                      />
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
