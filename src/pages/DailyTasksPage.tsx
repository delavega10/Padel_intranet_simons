import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, ClipboardList, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  ROUND_NUMBERS,
  getTodayWeekday,
  getWeekdayFromDate,
  todayDateString,
  type Weekday,
} from '@/lib/weekdays'
import type { DailyTask, DailyTaskCompletion, EmployeeCase } from '@/types'

export function DailyTasksPage() {
  const { user, profile, isAdmin } = useAuth()
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [completions, setCompletions] = useState<DailyTaskCompletion[]>([])
  const [cases, setCases] = useState<EmployeeCase[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<Weekday>(getTodayWeekday())
  const [viewDate, setViewDate] = useState(todayDateString())

  const [caseTitle, setCaseTitle] = useState('')
  const [caseDesc, setCaseDesc] = useState('')
  const [caseSaving, setCaseSaving] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newRound, setNewRound] = useState(1)
  const [taskSaving, setTaskSaving] = useState(false)

  const authorName = profile?.full_name || profile?.email?.split('@')[0] || 'Bruger'

  const load = useCallback(async () => {
    const [tasksRes, compRes, casesRes] = await Promise.all([
      supabase.from('daily_tasks').select('*').order('sort_order'),
      supabase
        .from('daily_task_completions')
        .select('*')
        .eq('completion_date', viewDate),
      supabase
        .from('employee_cases')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (tasksRes.data) setTasks(tasksRes.data as DailyTask[])
    if (compRes.data) setCompletions(compRes.data as DailyTaskCompletion[])
    if (casesRes.data) setCases(casesRes.data as EmployeeCase[])
    setLoading(false)
  }, [viewDate])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    setActiveDay(getWeekdayFromDate(viewDate))
  }, [viewDate])

  const openCases = cases.filter((c) => c.status === 'open')
  const dayTasks = tasks.filter((t) => t.weekday === activeDay)
  const completedIds = new Set(completions.map((c) => c.task_id))

  async function toggleTask(taskId: string) {
    if (!user) return
    if (completedIds.has(taskId)) {
      if (!isAdmin) return
      const row = completions.find((c) => c.task_id === taskId)
      if (row) {
        await supabase.from('daily_task_completions').delete().eq('id', row.id)
      }
    } else {
      await supabase.from('daily_task_completions').insert({
        task_id: taskId,
        completion_date: viewDate,
        completed_by: user.id,
      })
    }
    await load()
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !newTitle.trim()) return
    setTaskSaving(true)
    await supabase.from('daily_tasks').insert({
      weekday: activeDay,
      round_number: newRound,
      title: newTitle.trim(),
      sort_order: dayTasks.length,
    })
    setNewTitle('')
    setTaskSaving(false)
    await load()
  }

  async function deleteTask(id: string) {
    if (!isAdmin || !confirm('Slet opgaven?')) return
    await supabase.from('daily_tasks').delete().eq('id', id)
    await load()
  }

  async function submitCase(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !caseTitle.trim() || !caseDesc.trim()) return
    setCaseSaving(true)
    await supabase.from('employee_cases').insert({
      title: caseTitle.trim(),
      description: caseDesc.trim(),
      created_by: user.id,
      created_by_name: authorName,
    })
    setCaseTitle('')
    setCaseDesc('')
    setCaseSaving(false)
    await load()
  }

  async function resolveCase(id: string) {
    if (!isAdmin || !user) return
    await supabase
      .from('employee_cases')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daglige gøremål"
        description="Tjekliste per ugedag med runder — afkryds når opgaver er udført"
        icon={ClipboardList}
      />

      {isAdmin && openCases.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                {openCases.length} åben{openCases.length === 1 ? '' : 'e'} sag
                {openCases.length === 1 ? '' : 'er'} fra medarbejdere
              </h3>
              <ul className="mt-3 space-y-2">
                {openCases.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-amber-200 bg-white p-3 text-sm"
                  >
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="mt-1 text-gray-600">{c.description}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {c.created_by_name} · {formatDate(c.created_at.slice(0, 10))}
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => resolveCase(c.id)}
                    >
                      Marker som løst
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dato for afkrydsning
          </label>
          <input
            type="date"
            value={viewDate}
            onChange={(e) => setViewDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeDay === day
                ? 'bg-padel-600 text-white'
                : day === getTodayWeekday()
                  ? 'bg-padel-50 text-padel-700 hover:bg-padel-100'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {WEEKDAY_LABELS[day]}
            {day === getTodayWeekday() && (
              <span className="ml-1 text-xs opacity-80">(i dag)</span>
            )}
          </button>
        ))}
      </div>

      {isAdmin && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 normal-case">
            Admin: Opret opgave for {WEEKDAY_LABELS[activeDay]}
          </h3>
          <form onSubmit={addTask} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Opgave"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="f.eks. Tjek toiletter"
                required
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                label="Runde"
                value={String(newRound)}
                onChange={(e) => setNewRound(Number(e.target.value))}
              >
                {ROUND_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    Runde {n}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" loading={taskSaving}>
              <Plus className="h-4 w-4" />
              Tilføj
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {ROUND_NUMBERS.map((round) => {
          const roundTasks = dayTasks.filter((t) => t.round_number === round)
          if (roundTasks.length === 0) return null

          const done = roundTasks.filter((t) => completedIds.has(t.id)).length

          return (
            <section key={round} className="content-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 normal-case">
                  Runde {round}
                </h3>
                <span className="text-sm text-gray-500">
                  {done}/{roundTasks.length} udført
                </span>
              </div>
              <ul className="space-y-2">
                {roundTasks.map((task) => {
                  const done = completedIds.has(task.id)
                  const completion = completions.find((c) => c.task_id === task.id)
                  return (
                    <li
                      key={task.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        done
                          ? 'border-padel-200 bg-padel-50/50'
                          : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        disabled={done && !isAdmin}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          done
                            ? 'border-padel-600 bg-padel-600 text-white'
                            : 'border-gray-300 bg-white hover:border-padel-500'
                        } ${done && !isAdmin ? 'cursor-default opacity-90' : ''}`}
                        aria-label={
                          done
                            ? isAdmin
                              ? 'Fjern afkrydsning'
                              : 'Udført'
                            : 'Marker udført'
                        }
                      >
                        {done && <Check className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            done ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        {done && completion && (
                          <p className="mt-1 text-xs text-gray-500">
                            Afkrydset {formatDate(completion.completed_at.slice(0, 10))}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        {dayTasks.length === 0 && (
          <Card>
            <p className="text-sm text-gray-500">
              {isAdmin
                ? `Ingen opgaver for ${WEEKDAY_LABELS[activeDay]} endnu. Tilføj opgaver ovenfor.`
                : `Ingen opgaver planlagt for ${WEEKDAY_LABELS[activeDay]}.`}
            </p>
          </Card>
        )}
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-2 normal-case flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Opret sag (noget der skal fixes)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Har du set noget der skal repareres eller fixes? Admin får besked ved næste login.
        </p>
        <form onSubmit={submitCase} className="space-y-4">
          <Input
            label="Kort titel"
            value={caseTitle}
            onChange={(e) => setCaseTitle(e.target.value)}
            placeholder="f.eks. Løs håndtag ved indgang"
            required
          />
          <Textarea
            label="Beskrivelse"
            value={caseDesc}
            onChange={(e) => setCaseDesc(e.target.value)}
            placeholder="Beskriv problemet..."
            required
            rows={3}
          />
          <Button type="submit" loading={caseSaving}>
            Send sag til admin
          </Button>
        </form>
      </Card>
    </div>
  )
}
