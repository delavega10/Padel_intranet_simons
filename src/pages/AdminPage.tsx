import { Navigate, useSearchParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AdminDayOverviewTab } from './admin/AdminDayOverviewTab'
import { AdminNewsTab } from './admin/AdminNewsTab'
import { AdminUsersTab } from './admin/AdminUsersTab'
import { AdminAuditLogTab } from './admin/AdminAuditLogTab'

type AdminTab = 'overview' | 'news' | 'users' | 'log'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Dagens overblik' },
  { id: 'news', label: 'Feed-indlæg' },
  { id: 'users', label: 'Brugere' },
  { id: 'log', label: 'Aktivitetslog' },
]

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  if (tabParam === 'events') {
    return <Navigate to="/kalender" replace />
  }

  const activeTab: AdminTab =
    tabParam === 'news' || tabParam === 'users' || tabParam === 'log' ? tabParam : 'overview'

  return (
    <div>
      <PageHeader
        title="Admin-panel"
        description="Administrer indhold og brugere"
        icon={Shield}
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-padel-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-padel-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <AdminDayOverviewTab />}
      {activeTab === 'news' && <AdminNewsTab />}
      {activeTab === 'users' && <AdminUsersTab />}
      {activeTab === 'log' && <AdminAuditLogTab />}
    </div>
  )
}
