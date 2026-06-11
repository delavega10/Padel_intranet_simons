import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  ListTodo,
  ShoppingBag,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Input } from '@/components/ui/Input'
import { normalizeTaskArea } from '@/lib/dailyTaskAreas'
import {
  DAILY_ROUND_LABELS,
  DAILY_ROUND_NUMBERS,
  isRoundComplete,
  taskRoundNumber,
  tasksForRound,
} from '@/lib/dailyTaskRounds'
import { getWeekdayFromDate, todayDateString, WEEKDAY_LABELS } from '@/lib/weekdays'
import { formatDate } from '@/lib/format'
import type { DailyTask, EmployeeCase, ShopProduct } from '@/types'

interface CompletionRow {
  task_id: string
  completed_at: string
  completer_name: string
}

interface ReminderLine {
  product: ShopProduct
  quantity: number
  completed: boolean
}

export function AdminDayOverviewTab() {
  const [date, setDate] = useState(todayDateString())
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [completions, setCompletions] = useState<CompletionRow[]>([])
  const [openCases, setOpenCases] = useState<EmployeeCase[]>([])
  const [reminderLines, setReminderLines] = useState<ReminderLine[]>([])
  const [reminderNote, setReminderNote] = useState('')
  const [reminderUpdatedBy, setReminderUpdatedBy] = useState<string | null>(null)

  const weekday = getWeekdayFromDate(date)
  const isToday = date === todayDateString()

  const load = useCallback(async () => {
    setLoading(true)

    const [tasksRes, compRes, casesRes, prodRes, itemsRes, noteRes] = await Promise.all([
      supabase.from('daily_tasks').select('*').order('sort_order'),
      supabase
        .from('daily_task_completions')
        .select('task_id, completed_at, profiles:completed_by(full_name, email)')
        .eq('completion_date', date),
      supabase
        .from('employee_cases')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false }),
      supabase.from('shop_products').select('*').eq('active', true).order('sort_order'),
      supabase.from('shop_reminder_items').select('product_id, quantity, completed'),
      supabase.from('shop_reminder').select('note, updated_by_name').eq('id', 1).maybeSingle(),
    ])

    if (tasksRes.data) {
      setTasks(
        (tasksRes.data as DailyTask[]).map((t) => ({
          ...t,
          area: normalizeTaskArea(t.area),
        })),
      )
    }

    if (compRes.data) {
      setCompletions(
        compRes.data.map((row) => {
          const raw = row.profiles as
            | { full_name: string | null; email: string }
            | { full_name: string | null; email: string }[]
            | null
          const profile = Array.isArray(raw) ? raw[0] : raw
          return {
            task_id: row.task_id,
            completed_at: row.completed_at,
            completer_name: profile?.full_name || profile?.email?.split('@')[0] || 'Ukendt',
          }
        }),
      )
    } else {
      setCompletions([])
    }

    if (casesRes.data) setOpenCases(casesRes.data as EmployeeCase[])
    else setOpenCases([])

    const products = (prodRes.data ?? []) as ShopProduct[]
    const qtyMap = new Map<string, { quantity: number; completed: boolean }>()
    itemsRes.data?.forEach((row) => {
      qtyMap.set(row.product_id, {
        quantity: row.quantity,
        completed: row.completed ?? false,
      })
    })

    setReminderLines(
      products
        .map((product) => {
          const item = qtyMap.get(product.id)
          if (!item || item.quantity <= 0) return null
          return { product, quantity: item.quantity, completed: item.completed }
        })
        .filter((line): line is ReminderLine => line !== null),
    )

    setReminderNote(noteRes.data?.note ?? '')
    setReminderUpdatedBy(noteRes.data?.updated_by_name ?? null)
    setLoading(false)
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  const dayTasks = useMemo(() => tasks.filter((t) => t.weekday === weekday), [tasks, weekday])
  const completedIds = useMemo(() => new Set(completions.map((c) => c.task_id)), [completions])
  const completionByTask = useMemo(
    () => new Map(completions.map((c) => [c.task_id, c])),
    [completions],
  )

  const doneCount = dayTasks.filter((t) => completedIds.has(t.id)).length
  const totalCount = dayTasks.length
  const allDone = totalCount > 0 && doneCount === totalCount
  const pendingReminder = reminderLines.filter((l) => !l.completed)
  const doneReminder = reminderLines.filter((l) => l.completed)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 normal-case">Dagens overblik</h3>
          <p className="mt-1 text-sm text-gray-500">
            {WEEKDAY_LABELS[weekday]}
            {isToday ? ' (i dag)' : ''} — {formatDate(date)}
          </p>
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            label="Vælg dag"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={ClipboardList}
          label="Daglige opgaver"
          value={totalCount === 0 ? 'Ingen planlagt' : `${doneCount}/${totalCount}`}
          tone={allDone ? 'success' : totalCount > 0 && doneCount < totalCount ? 'warning' : 'neutral'}
          hint={allDone ? 'Alle løst' : totalCount > 0 ? `${totalCount - doneCount} mangler` : undefined}
        />
        <SummaryCard
          icon={ShoppingBag}
          label="Huskeseddel"
          value={reminderLines.length === 0 ? 'Tom' : `${pendingReminder.length} skal bestilles`}
          tone={pendingReminder.length > 0 ? 'warning' : 'success'}
          hint={
            reminderLines.length > 0
              ? `${doneReminder.length} markeret færdig`
              : undefined
          }
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Åbne sager"
          value={String(openCases.length)}
          tone={openCases.length > 0 ? 'warning' : 'success'}
          hint={openCases.length > 0 ? 'Kræver opmærksomhed' : 'Ingen åbne sager'}
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="font-semibold text-gray-900 normal-case flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-padel-600" />
            Daglige opgaver
          </h4>
          <Link
            to="/goremal"
            className="inline-flex items-center gap-1 text-sm text-padel-600 hover:text-padel-700"
          >
            Gå til opgaver <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {totalCount === 0 ? (
          <p className="text-sm text-gray-500">Ingen opgaver planlagt for {WEEKDAY_LABELS[weekday].toLowerCase()}.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DAILY_ROUND_NUMBERS.map((round) => {
                const roundTasks = tasksForRound(dayTasks, round)
                const roundDone = roundTasks.filter((t) => completedIds.has(t.id)).length
                const complete = isRoundComplete(dayTasks, round, completedIds)
                if (roundTasks.length === 0) return null
                return (
                  <div
                    key={round}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      complete
                        ? 'border-green-200 bg-green-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{DAILY_ROUND_LABELS[round]}</p>
                    <p className="mt-0.5 text-gray-600">
                      {roundDone}/{roundTasks.length}{' '}
                      {complete ? '— færdig' : '— mangler'}
                    </p>
                  </div>
                )
              })}
            </div>

            <ul className="divide-y divide-gray-100">
              {dayTasks.map((task) => {
                const done = completedIds.has(task.id)
                const completion = completionByTask.get(task.id)
                return (
                  <li key={task.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${done ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {DAILY_ROUND_LABELS[taskRoundNumber(task)]}
                        {done && completion
                          ? ` · afkrydset af ${completion.completer_name}`
                          : ' · ikke løst endnu'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="font-semibold text-gray-900 normal-case flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-padel-600" />
            Huskeseddel — varer der skal bestilles
          </h4>
          <Link
            to="/bestillinger"
            className="inline-flex items-center gap-1 text-sm text-padel-600 hover:text-padel-700"
          >
            Gå til huskeseddel <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {reminderUpdatedBy && (
          <p className="mb-3 text-xs text-gray-500">Sidst opdateret af {reminderUpdatedBy}</p>
        )}

        {reminderLines.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen varer på huskesedlen lige nu.</p>
        ) : (
          <ul className="space-y-2">
            {reminderLines.map((line) => (
              <li
                key={line.product.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  line.completed
                    ? 'border-green-200 bg-green-50 text-gray-600'
                    : 'border-amber-200 bg-amber-50 text-gray-900'
                }`}
              >
                <span>
                  {line.product.name} × {line.quantity}
                </span>
                <span className="text-xs font-medium">
                  {line.completed ? 'Bestilt' : 'Skal bestilles'}
                </span>
              </li>
            ))}
          </ul>
        )}

        {reminderNote.trim() && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
            {reminderNote}
          </p>
        )}
      </Card>

      {openCases.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-gray-900 normal-case flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Åbne medarbejdersager
            </h4>
            <Link
              to="/goremal"
              className="inline-flex items-center gap-1 text-sm text-padel-600 hover:text-padel-700"
            >
              Se sager <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-2">
            {openCases.map((c) => (
              <li key={c.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  {c.created_by_name} · {formatDate(c.created_at.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof ClipboardList
  label: string
  value: string
  hint?: string
  tone: 'success' | 'warning' | 'neutral'
}) {
  const tones = {
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    neutral: 'border-gray-200 bg-white',
  }
  const iconTones = {
    success: 'text-green-600',
    warning: 'text-amber-600',
    neutral: 'text-padel-600',
  }

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconTones[tone]}`} />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
