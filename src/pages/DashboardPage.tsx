import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Newspaper, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { NewsFeed } from '@/components/news/NewsFeed'
import { DashboardSidePanels } from '@/components/dashboard/DashboardSidePanels'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { EmployeeCase } from '@/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'Godmorgen'
  if (hour < 17) return 'Goddag'
  return 'Godaften'
}

function getTodayLabel(): string {
  const label = new Date().toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function DashboardPage() {
  const { profile, isAdmin, isEmil } = useAuth()
  const [openCases, setOpenCases] = useState<EmployeeCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (isAdmin) {
        const { data: cases } = await supabase
          .from('employee_cases')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5)
        if (cases) setOpenCases(cases as EmployeeCase[])
      }

      setLoading(false)
    }
    load()
  }, [isAdmin])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'kollega'

  if (loading) return <LoadingSpinner />

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-2 text-gray-600 normal-case">
          {getTodayLabel()} — her er dit overblik
        </p>
      </div>

      {isAdmin && openCases.length > 0 && (
        <Link
          to="/goremal"
          className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100/80"
        >
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {openCases.length} åben{openCases.length === 1 ? '' : 'e'} sag
              {openCases.length === 1 ? '' : 'er'} fra medarbejdere
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Seneste: {openCases[0].title} — klik for at se og løse
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 shrink-0 self-center text-amber-700" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 normal-case">
            <Newspaper className="h-5 w-5 text-padel-600" />
            Nyhedsfeed
          </h2>
          <NewsFeed showComposer={!isEmil || isAdmin} showHeader={false} />
        </div>

        <div className="hidden lg:block space-y-4">
          <DashboardSidePanels />
        </div>
      </div>
    </div>
  )
}
