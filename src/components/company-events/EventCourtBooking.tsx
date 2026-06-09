import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CompanyEvent } from '@/types'

const COURT_NUMBERS = Array.from({ length: 13 }, (_, i) => i + 1)

interface EventCourtBookingProps {
  event: CompanyEvent
  isAdmin: boolean
  onUpdated: () => void
}

export function EventCourtBooking({ event, isAdmin, onUpdated }: EventCourtBookingProps) {
  const [matchiBooked, setMatchiBooked] = useState(event.matchi_booked)
  const [courts, setCourts] = useState<number[]>(event.booked_court_numbers ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMatchiBooked(event.matchi_booked)
    setCourts([...(event.booked_court_numbers ?? [])].sort((a, b) => a - b))
  }, [event.id, event.matchi_booked, event.booked_court_numbers])

  async function save(next: { matchi_booked?: boolean; booked_court_numbers?: number[] }) {
    if (!isAdmin) return
    setSaving(true)
    await supabase.from('company_events').update(next).eq('id', event.id)
    setSaving(false)
    onUpdated()
  }

  async function toggleMatchiBooked() {
    const next = !matchiBooked
    setMatchiBooked(next)
    await save({ matchi_booked: next })
  }

  async function toggleCourt(n: number) {
    const next = courts.includes(n) ? courts.filter((c) => c !== n) : [...courts, n].sort((a, b) => a - b)
    setCourts(next)
    await save({ booked_court_numbers: next })
  }

  const selectedSet = new Set(courts)

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Baner i Matchi</h3>

      <label
        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 mb-4 ${
          isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${matchiBooked ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
      >
        <input
          type="checkbox"
          checked={matchiBooked}
          onChange={toggleMatchiBooked}
          disabled={!isAdmin || saving}
          className="rounded border-gray-300 text-padel-600"
        />
        <span className={`text-sm font-medium ${matchiBooked ? 'text-green-800' : 'text-gray-700'}`}>
          Baner er booket i Matchi
        </span>
        {matchiBooked && <Check className="h-4 w-4 text-green-600 ml-auto" />}
      </label>

      <p className="text-xs text-gray-500 mb-2">
        {isAdmin ? 'Klik på banerne der er booket:' : 'Bookede baner:'}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {COURT_NUMBERS.map((n) => {
          const selected = selectedSet.has(n)
          return (
            <button
              key={n}
              type="button"
              disabled={!isAdmin || saving}
              onClick={() => toggleCourt(n)}
              className={`flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                selected
                  ? 'border-padel-500 bg-padel-600 text-white shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              } ${isAdmin && !saving ? 'hover:border-padel-400 hover:bg-padel-50 hover:text-padel-700' : ''} ${
                !isAdmin ? 'cursor-default' : ''
              }`}
              aria-pressed={selected}
              aria-label={`Bane ${n}${selected ? ', booket' : ''}`}
            >
              {n}
            </button>
          )
        })}
      </div>

      {courts.length > 0 ? (
        <p className="text-sm text-gray-600 mt-3">
          Valgt: bane {courts.join(', bane ')}
        </p>
      ) : (
        <p className="text-sm text-gray-400 mt-3">Ingen baner valgt endnu</p>
      )}
    </section>
  )
}
