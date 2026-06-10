import { useEffect, useState } from 'react'
import { ScrollText, UserMinus, UserPen, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'

type AuditAction = 'create_user' | 'update_user' | 'delete_user'

interface AuditEntry {
  id: string
  actor_email: string
  action: AuditAction
  target_email: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const actionConfig: Record<AuditAction, { label: string; icon: typeof UserPlus; tone: string }> = {
  create_user: { label: 'Oprettede bruger', icon: UserPlus, tone: 'text-padel-600' },
  update_user: { label: 'Redigerede bruger', icon: UserPen, tone: 'text-amber-600' },
  delete_user: { label: 'Slettede bruger', icon: UserMinus, tone: 'text-red-600' },
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function describeDetails(entry: AuditEntry): string | null {
  const d = entry.details
  if (!d) return null
  const parts: string[] = []
  if (typeof d.role === 'string') parts.push(`rolle: ${d.role}`)
  if (typeof d.approved === 'boolean') parts.push(d.approved ? 'godkendt' : 'ikke godkendt')
  if (d.password_changed === true) parts.push('adgangskode ændret')
  if (typeof d.full_name === 'string' && d.full_name) parts.push(`navn: ${d.full_name}`)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function AdminAuditLogTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (loadError) {
        setError('Kunne ikke hente loggen: ' + loadError.message)
      } else if (data) {
        setEntries(data as AuditEntry[])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-gray-500">Indlæser aktivitetslog...</p>
  if (error) {
    return <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 normal-case flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-padel-600" />
        Seneste brugerhandlinger
      </h3>

      {entries.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            Ingen handlinger registreret endnu. Loggen udfyldes når brugere oprettes, redigeres
            eller slettes.
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const config = actionConfig[entry.action]
              const Icon = config.icon
              const details = describeDetails(entry)
              return (
                <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{entry.actor_email}</span>{' '}
                      <span className="text-gray-600">{config.label.toLowerCase()}</span>{' '}
                      <span className="font-medium">{entry.target_email ?? 'ukendt'}</span>
                    </p>
                    {details && <p className="mt-0.5 text-xs text-gray-500">{details}</p>}
                  </div>
                  <p className="shrink-0 text-xs text-gray-500">
                    {formatTimestamp(entry.created_at)}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
