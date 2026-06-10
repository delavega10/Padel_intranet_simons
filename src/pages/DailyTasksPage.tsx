import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ClipboardList, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { DailyTaskRoundBox } from '@/components/daily-tasks/DailyTaskRoundBox'
import { formatDate } from '@/lib/format'
import {
  DAILY_TASK_AREAS,
  DAILY_TASK_AREA_LABELS,
  normalizeTaskArea,
} from '@/lib/dailyTaskAreas'
import {
  activeEmployeeRound,
  DAILY_ROUND_LABELS,
  DAILY_ROUND_NUMBERS,
  isRoundUnlocked,
  taskRoundNumber,
  tasksForRound,
  type DailyRoundNumber,
} from '@/lib/dailyTaskRounds'
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  getTodayWeekday,
  getWeekdayFromDate,
  todayDateString,
  type Weekday,
} from '@/lib/weekdays'
import type { DailyTask, DailyTaskArea, DailyTaskCompletion, EmployeeCase } from '@/types'

export function DailyTasksPage() {
  const { user, profile, isAdmin } = useAuth()
  const today = todayDateString()
  const todayWeekday = getTodayWeekday()

  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [completions, setCompletions] = useState<DailyTaskCompletion[]>([])
  const [cases, setCases] = useState<EmployeeCase[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<Weekday>(todayWeekday)
  const [viewDate, setViewDate] = useState(today)

  const [caseModalOpen, setCaseModalOpen] = useState(false)
  const [caseTitle, setCaseTitle] = useState('')
  const [caseDesc, setCaseDesc] = useState('')
  const [caseSaving, setCaseSaving] = useState(false)
  const [caseSent, setCaseSent] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArea, setNewArea] = useState<DailyTaskArea>('cafe')
  const [newRound, setNewRound] = useState<DailyRoundNumber>(1)
  const [taskSaving, setTaskSaving] = useState(false)
  const [adminOpenRounds, setAdminOpenRounds] = useState<Set<DailyRoundNumber>>(new Set([1]))
  const [employeeOpenRound, setEmployeeOpenRound] = useState<DailyRoundNumber | null>(null)

  const effectiveDate = isAdmin ? viewDate : today
  const effectiveDay = isAdmin ? activeDay : todayWeekday

  const authorName = profile?.full_name || profile?.email?.split('@')[0] || 'Bruger'

  const load = useCallback(async () => {
    const tasksRes = await supabase.from('daily_tasks').select('*').order('sort_order')
    const compRes = await supabase
      .from('daily_task_completions')
      .select('*')
      .eq('completion_date', effectiveDate)

    if (tasksRes.data) {
      setTasks(
        (tasksRes.data as DailyTask[]).map((t) => ({
          ...t,
          area: normalizeTaskArea(t.area),
        })),
      )
    }
    if (compRes.data) setCompletions(compRes.data as DailyTaskCompletion[])

    if (isAdmin) {
      const casesRes = await supabase
        .from('employee_cases')
        .select('*')
        .order('created_at', { ascending: false })
      if (casesRes.data) setCases(casesRes.data as EmployeeCase[])
    } else {
      setCases([])
    }

    setLoading(false)
  }, [effectiveDate, isAdmin])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (isAdmin) {
      setActiveDay(getWeekdayFromDate(viewDate))
    }
  }, [viewDate, isAdmin])

  const openCases = cases.filter((c) => c.status === 'open')
  const dayTasks = tasks.filter((t) => t.weekday === effectiveDay)
  const completedIds = new Set(completions.map((c) => c.task_id))

  const currentEmployeeRound = useMemo(
    () => (isAdmin ? null : activeEmployeeRound(dayTasks, completedIds)),
    [dayTasks, completedIds, isAdmin],
  )

  useEffect(() => {
    if (isAdmin) return
    setEmployeeOpenRound(currentEmployeeRound)
  }, [currentEmployeeRound, isAdmin])

  function handleRoundOpenChange(round: DailyRoundNumber, open: boolean) {
    if (isAdmin) {
      setAdminOpenRounds((prev) => {
        const next = new Set(prev)
        if (open) next.add(round)
        else next.delete(round)
        return next
      })
      return
    }
    if (!isRoundUnlocked(dayTasks, round, completedIds, false)) return
    if (open && round !== currentEmployeeRound) return
    setEmployeeOpenRound(open ? round : null)
  }

  async function toggleTask(taskId: string) {
    if (!user) return
    const task = dayTasks.find((t) => t.id === taskId)
    if (!task) return
    if (
      !isAdmin &&
      !isRoundUnlocked(dayTasks, taskRoundNumber(task), completedIds, false)
    ) {
      return
    }
    if (completedIds.has(taskId)) {
      if (!isAdmin) return
      const row = completions.find((c) => c.task_id === taskId)
      if (row) {
        await supabase.from('daily_task_completions').delete().eq('id', row.id)
      }
    } else {
      await supabase.from('daily_task_completions').insert({
        task_id: taskId,
        completion_date: effectiveDate,
        completed_by: user.id,
      })
    }
    await load()
  }

  function resetTaskForm() {
    setTaskModalOpen(false)
    setNewTitle('')
    setNewArea('cafe')
    setNewRound(1)
  }

  function openTaskModal() {
    setNewTitle('')
    setNewArea('cafe')
    setNewRound(1)
    setTaskModalOpen(true)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !newTitle.trim()) return
    setTaskSaving(true)
    const roundTasks = tasksForRound(dayTasks, newRound)
    await supabase.from('daily_tasks').insert({
      weekday: effectiveDay,
      area: newArea,
      round_number: newRound,
      title: newTitle.trim(),
      sort_order: roundTasks.length,
    })
    setTaskSaving(false)
    resetTaskForm()
    await load()
  }

  async function deleteTask(id: string) {
    if (!isAdmin || !confirm('Slet opgaven?')) return
    await supabase.from('daily_tasks').delete().eq('id', id)
    await load()
  }

  function resetCaseForm() {
    setCaseModalOpen(false)
    setCaseTitle('')
    setCaseDesc('')
    setCaseSent(false)
  }

  function openCaseModal() {
    setCaseTitle('')
    setCaseDesc('')
    setCaseSent(false)
    setCaseModalOpen(true)
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
    setCaseSaving(false)
    setCaseSent(true)
    setCaseTitle('')
    setCaseDesc('')
    await load()
    setTimeout(() => resetCaseForm(), 1500)
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
    <div className="space-y-6 pb-24 sm:pb-0">
      <PageHeader
        title="Daglige gøremål"
        description={
          isAdmin
            ? 'Opgaver i 3 vagtrunder + lukkerunde — medarbejdere ser kun dagens vagt'
            : `Dagens vagt — ${WEEKDAY_LABELS[todayWeekday]}, ${formatDate(today)}`
        }
        icon={ClipboardList}
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button type="button" onClick={openTaskModal} className="hidden sm:inline-flex">
                <Plus className="h-4 w-4" />
                Tilføj opgave
              </Button>
            )}
            <Button type="button" onClick={openCaseModal} className="hidden sm:inline-flex">
              <AlertTriangle className="h-4 w-4" />
              Opret sag
            </Button>
          </div>
        }
      />

      {isAdmin && (
        <Modal
          open={taskModalOpen}
          onClose={resetTaskForm}
          title={`Ny opgave — ${WEEKDAY_LABELS[effectiveDay]}`}
        >
          <form onSubmit={addTask} className="space-y-4">
            <Select
              label="Runde"
              value={String(newRound)}
              onChange={(e) => setNewRound(Number(e.target.value) as DailyRoundNumber)}
            >
              {DAILY_ROUND_NUMBERS.map((round) => (
                <option key={round} value={round}>
                  {DAILY_ROUND_LABELS[round]}
                </option>
              ))}
            </Select>
            <Select
              label="Område"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value as DailyTaskArea)}
            >
              {DAILY_TASK_AREAS.map((area) => (
                <option key={area} value={area}>
                  {DAILY_TASK_AREA_LABELS[area]}
                </option>
              ))}
            </Select>
            <Input
              label="Opgave"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="f.eks. Fyld kaffemaskine"
              required
            />
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button type="submit" loading={taskSaving} className="w-full sm:w-auto">
                Tilføj opgave
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetTaskForm}
                className="w-full sm:w-auto"
              >
                Annuller
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal open={caseModalOpen} onClose={resetCaseForm} title="Opret sag til admin">
        {caseSent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="font-medium text-gray-900">Sagen er sendt</p>
            <p className="mt-1 text-sm text-gray-500">
              En administrator ser den på dashboard og her under daglige opgaver.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Beskriv noget der skal fixes — admin får besked med det samme.
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
                rows={4}
              />
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button type="submit" loading={caseSaving} className="w-full sm:w-auto">
                  Send sag til admin
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetCaseForm}
                  className="w-full sm:w-auto"
                >
                  Annuller
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-gray-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:hidden">
        {isAdmin && (
          <Button type="button" variant="secondary" onClick={openTaskModal} className="flex-1">
            <Plus className="h-4 w-4" />
            Opgave
          </Button>
        )}
        <Button type="button" onClick={openCaseModal} className="flex-1">
          <AlertTriangle className="h-4 w-4" />
          Opret sag
        </Button>
      </div>

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

      {isAdmin ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dato for afkrydsning
              </label>
              <input
                type="date"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeDay === day
                    ? 'bg-padel-600 text-white'
                    : day === todayWeekday
                      ? 'bg-padel-50 text-padel-700 hover:bg-padel-100'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {WEEKDAY_LABELS[day]}
                {day === todayWeekday && (
                  <span className="ml-1 hidden text-xs opacity-80 sm:inline">(i dag)</span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Card className="daily-shift-info">
          <p className="daily-shift-info-title text-sm">
            <span className="font-semibold">Dagens vagt:</span> {WEEKDAY_LABELS[todayWeekday]},{' '}
            {formatDate(today)}
          </p>
          <p className="daily-shift-info-sub mt-1 text-xs">
            Kun én runde kan åbnes ad gangen. Næste runde låses op når alle opgaver i den
            forrige er afkrydset — lukkerunden til sidst.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {DAILY_ROUND_NUMBERS.map((round) => (
          <DailyTaskRoundBox
            key={round}
            round={round}
            tasks={tasksForRound(dayTasks, round)}
            completions={completions}
            completedIds={completedIds}
            unlocked={isRoundUnlocked(dayTasks, round, completedIds, isAdmin)}
            isAdmin={isAdmin}
            open={isAdmin ? adminOpenRounds.has(round) : employeeOpenRound === round}
            onOpenChange={(open) => handleRoundOpenChange(round, open)}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>

      {dayTasks.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500 text-center">
            {isAdmin
              ? `Ingen opgaver for ${WEEKDAY_LABELS[effectiveDay]} endnu. Klik «Tilføj opgave» for at komme i gang.`
              : 'Ingen opgaver planlagt for din vagt i dag.'}
          </p>
        </Card>
      )}
    </div>
  )
}
