import { useSearchParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AdminNewsTab } from './admin/AdminNewsTab'
import { AdminEventsTab } from './admin/AdminEventsTab'
import { AdminDocumentsTab } from './admin/AdminDocumentsTab'
import { AdminUsersTab } from './admin/AdminUsersTab'

type AdminTab = 'news' | 'events' | 'documents' | 'users'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'news', label: 'Feed-indlæg' },
  { id: 'events', label: 'Events' },
  { id: 'documents', label: 'Dokumenter' },
  { id: 'users', label: 'Brugere' },
]

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as AdminTab) || 'news'

  return (
    <div>
      <PageHeader
        title="Admin-panel"
        description="Administrer indhold, dokumenter og brugere"
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

      {activeTab === 'news' && <AdminNewsTab />}
      {activeTab === 'events' && <AdminEventsTab />}
      {activeTab === 'documents' && <AdminDocumentsTab />}
      {activeTab === 'users' && <AdminUsersTab />}
    </div>
  )
}
