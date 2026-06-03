import { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { LunaCaptain } from '@/types'

interface LunaCaptainCardProps {
  captain: LunaCaptain
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

export function LunaCaptainCard({
  captain,
  isAdmin,
  open,
  onToggle,
  onUpdated,
  onDelete,
}: LunaCaptainCardProps) {
  const [comment, setComment] = useState(captain.booking_dates_comment)
  const [editName, setEditName] = useState(captain.name)
  const [editTeam, setEditTeam] = useState(captain.team ?? '')
  const [editPhone, setEditPhone] = useState(captain.phone ?? '')
  const [editEmail, setEditEmail] = useState(captain.email ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setComment(captain.booking_dates_comment)
    setEditName(captain.name)
    setEditTeam(captain.team ?? '')
    setEditPhone(captain.phone ?? '')
    setEditEmail(captain.email ?? '')
  }, [
    captain.id,
    captain.booking_dates_comment,
    captain.name,
    captain.team,
    captain.phone,
    captain.email,
  ])

  async function patch(fields: Partial<LunaCaptain>) {
    setSaving(true)
    await supabase
      .from('luna_captains')
      .update({ ...fields, tracking_updated_at: new Date().toISOString() })
      .eq('id', captain.id)
    setSaving(false)
    onUpdated()
  }

  async function saveComment() {
    if (comment === captain.booking_dates_comment) return
    await patch({ booking_dates_comment: comment })
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !editName.trim()) return
    setSaving(true)
    await supabase
      .from('luna_captains')
      .update({
        name: editName.trim(),
        team: editTeam.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
      })
      .eq('id', captain.id)
    setSaving(false)
    onUpdated()
  }

  const hasDates = Boolean(captain.booking_dates_comment.trim())
  const profileDirty =
    isAdmin &&
    (editName.trim() !== captain.name ||
      (editTeam.trim() || null) !== captain.team ||
      (editPhone.trim() || null) !== captain.phone ||
      (editEmail.trim() || null) !== captain.email)

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
            <p className="font-semibold text-gray-900 truncate">{captain.name}</p>
            {captain.team && (
              <p className="text-sm text-padel-700 truncate">{captain.team}</p>
            )}
          </div>
          {!open && (
            <div className="hidden sm:flex flex-wrap justify-end gap-1.5 shrink-0">
              <StatusPill ok={hasDates} okLabel="Datoer" pendingLabel="Ingen datoer" />
              <StatusPill ok={captain.invoice_sent} okLabel="Faktura" pendingLabel="Faktura" />
              <StatusPill
                ok={captain.matchi_booking_confirmed}
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
              onDelete(captain.id)
            }}
            className="shrink-0 border-l border-gray-100 px-3 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Slet kaptajn"
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
                Rediger kaptajn / hold
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Navn"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                <Input
                  label="Hold"
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
                Gem kaptajn-info
              </Button>
            </form>
          ) : (
            (captain.phone || captain.email) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                {captain.phone && <span>{captain.phone}</span>}
                {captain.email && (
                  <a href={`mailto:${captain.email}`} className="text-padel-600 hover:underline">
                    {captain.email}
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
            placeholder="fx 12/6 kl. 18–20, 15/6 kl. 10–12..."
            rows={2}
            disabled={saving}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
            <button
              type="button"
              onClick={() => patch({ invoice_sent: !captain.invoice_sent })}
              disabled={saving}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                captain.invoice_sent
                  ? 'border-green-600 bg-green-500 text-white'
                  : 'border-gray-300 bg-white hover:border-padel-500'
              }`}
              aria-label="Faktura sendt"
            >
              {captain.invoice_sent && <Check className="h-4 w-4" />}
            </button>
            <span className="text-sm font-medium text-gray-900">Faktura sendt</span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
              captain.matchi_booking_confirmed
                ? 'border-green-300 bg-green-50'
                : 'border-amber-300 bg-amber-50'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                patch({ matchi_booking_confirmed: !captain.matchi_booking_confirmed })
              }
              disabled={saving}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                captain.matchi_booking_confirmed
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-amber-500 bg-white hover:border-amber-600'
              }`}
              aria-label="Matchi booking bekræftet"
            >
              {captain.matchi_booking_confirmed && <Check className="h-4 w-4" />}
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <AlertCircle
                  className={`h-4 w-4 shrink-0 ${
                    captain.matchi_booking_confirmed ? 'text-green-600' : 'text-amber-600'
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
