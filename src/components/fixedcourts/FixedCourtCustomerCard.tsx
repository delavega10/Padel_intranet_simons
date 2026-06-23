import { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { FixedCourtCustomer } from '@/types'

interface FixedCourtCustomerCardProps {
  customer: FixedCourtCustomer
  isAdmin: boolean
  open: boolean
  onToggle: () => void
  onUpdated: () => void
  onDelete: (id: string) => void
}

function StatusPill({
  ok,
  okLabel,
  pendingLabel,
}: {
  ok: boolean
  okLabel: string
  pendingLabel: string
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {ok ? okLabel : pendingLabel}
    </span>
  )
}

export function FixedCourtCustomerCard({
  customer,
  isAdmin,
  open,
  onToggle,
  onUpdated,
  onDelete,
}: FixedCourtCustomerCardProps) {
  const [comment, setComment] = useState(customer.booking_dates_comment)
  const [editName, setEditName] = useState(customer.name)
  const [editTeam, setEditTeam] = useState(customer.team ?? '')
  const [editPhone, setEditPhone] = useState(customer.phone ?? '')
  const [editEmail, setEditEmail] = useState(customer.email ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setComment(customer.booking_dates_comment)
    setEditName(customer.name)
    setEditTeam(customer.team ?? '')
    setEditPhone(customer.phone ?? '')
    setEditEmail(customer.email ?? '')
  }, [
    customer.id,
    customer.booking_dates_comment,
    customer.name,
    customer.team,
    customer.phone,
    customer.email,
  ])

  async function patch(fields: Partial<FixedCourtCustomer>) {
    setSaving(true)
    await supabase
      .from('fixed_court_customers')
      .update({ ...fields, tracking_updated_at: new Date().toISOString() })
      .eq('id', customer.id)
    setSaving(false)
    onUpdated()
  }

  async function saveComment() {
    if (comment === customer.booking_dates_comment) return
    await patch({ booking_dates_comment: comment })
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !editName.trim()) return
    setSaving(true)
    await supabase
      .from('fixed_court_customers')
      .update({
        name: editName.trim(),
        team: editTeam.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
      })
      .eq('id', customer.id)
    setSaving(false)
    onUpdated()
  }

  const hasDates = Boolean(customer.booking_dates_comment.trim())
  const profileDirty =
    isAdmin &&
    (editName.trim() !== customer.name ||
      (editTeam.trim() || null) !== customer.team ||
      (editPhone.trim() || null) !== customer.phone ||
      (editEmail.trim() || null) !== customer.email)

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          aria-expanded={open}
        >
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
            {customer.team && (
              <p className="text-sm text-padel-700 truncate">{customer.team}</p>
            )}
          </div>
          {!open && (
            <div className="hidden sm:flex flex-wrap justify-end gap-1.5 shrink-0">
              <StatusPill ok={hasDates} okLabel="Datoer" pendingLabel="Ingen datoer" />
              <StatusPill ok={customer.invoice_sent} okLabel="Faktura" pendingLabel="Faktura" />
              <StatusPill
                ok={customer.matchi_booking_confirmed}
                okLabel="Matchi ✓"
                pendingLabel="Matchi"
              />
            </div>
          )}
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(customer.id)
            }}
            className="shrink-0 border-l border-gray-100 px-3 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Slet kunde"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-4 space-y-4">
          {isAdmin ? (
            <form onSubmit={saveProfile} className="rounded-lg border border-padel-200 bg-padel-50/40 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 normal-case">
                Rediger kunde
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Navn"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                <Input
                  label="Hold / firma"
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                />
                <Input
                  label="Telefon"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" loading={saving} disabled={!profileDirty}>
                Gem kunde-info
              </Button>
            </form>
          ) : (
            (customer.phone || customer.email) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                {customer.phone && <span>{customer.phone}</span>}
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="text-padel-600 hover:underline">
                    {customer.email}
                  </a>
                )}
              </div>
            )
          )}

          <Textarea
            label="Datoer for bookede baner"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={saveComment}
            placeholder="fx hver mandag kl. 18–20, 12/6 kl. 10–12..."
            rows={2}
            disabled={saving}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
            <button
              type="button"
              onClick={() => patch({ invoice_sent: !customer.invoice_sent })}
              disabled={saving}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                customer.invoice_sent
                  ? 'border-green-600 bg-green-500 text-white'
                  : 'border-gray-300 bg-white hover:border-padel-500'
              }`}
              aria-label="Faktura sendt"
            >
              {customer.invoice_sent && <Check className="h-4 w-4" />}
            </button>
            <span className="text-sm font-medium text-gray-900">Faktura sendt</span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
              customer.matchi_booking_confirmed
                ? 'border-green-300 bg-green-50'
                : 'border-amber-300 bg-amber-50'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                patch({ matchi_booking_confirmed: !customer.matchi_booking_confirmed })
              }
              disabled={saving}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                customer.matchi_booking_confirmed
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-amber-500 bg-white hover:border-amber-600'
              }`}
              aria-label="Matchi booking bekræftet"
            >
              {customer.matchi_booking_confirmed && <Check className="h-4 w-4" />}
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <AlertCircle
                  className={`h-4 w-4 shrink-0 ${
                    customer.matchi_booking_confirmed ? 'text-green-600' : 'text-amber-600'
                  }`}
                />
                Matchi — booket/afbooket baner
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Jeg bekræfter, at jeg har booket eller afbooket banerne i Matchi.
              </p>
            </div>
          </label>
        </div>
      )}
    </Card>
  )
}
