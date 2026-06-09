import { useEffect, useState, type FormEvent } from 'react'
import { Mail, Package, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { LunaPlayerSetOffer } from '@/types'

const OFFER_ID = '00000000-0000-0000-0000-000000000001'

const emptyOffer = {
  set_name: 'Spillersæt',
  quantity: '',
  included_description: '',
  price: '',
}

interface LunaPlayerSetOfferSettingsProps {
  isAdmin: boolean
  offer: LunaPlayerSetOffer | null
  onSaved: () => void
}

export function LunaPlayerSetOfferSettings({
  isAdmin,
  offer,
  onSaved,
}: LunaPlayerSetOfferSettingsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyOffer)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (offer) {
      setForm({
        set_name: offer.set_name,
        quantity: offer.quantity?.toString() ?? '',
        included_description: offer.included_description ?? '',
        price: offer.price?.toString() ?? '',
      })
    }
  }, [offer])

  function openModal() {
    if (offer) {
      setForm({
        set_name: offer.set_name,
        quantity: offer.quantity?.toString() ?? '',
        included_description: offer.included_description ?? '',
        price: offer.price?.toString() ?? '',
      })
    } else {
      setForm(emptyOffer)
    }
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    await supabase.from('luna_player_set_offer').upsert({
      id: OFFER_ID,
      set_name: form.set_name.trim() || 'Spillersæt',
      quantity: form.quantity ? parseInt(form.quantity, 10) : null,
      included_description: form.included_description.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
    })
    setSaving(false)
    closeModal()
    onSaved()
  }

  const hasOffer =
    offer &&
    (offer.set_name ||
      offer.quantity != null ||
      offer.price != null ||
      offer.included_description)

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 normal-case flex items-center gap-2">
              <Package className="h-4 w-4 text-padel-600" />
              Spillersæt-tilbud til kunder
            </h3>
            <p className="text-sm text-gray-500">
              Vi sender en mail med et tilbud til kunden om køb af spillersæt. Under hvert hold kan
              I kopiére eller sende mailen — og markere når tilbuddet er sendt.
            </p>
            {hasOffer && (
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Sæt</dt>
                  <dd className="font-medium text-gray-900">{offer!.set_name}</dd>
                </div>
                {offer!.quantity != null && (
                  <div>
                    <dt className="text-gray-500">Antal (stk.)</dt>
                    <dd className="font-medium text-gray-900">{offer!.quantity} stk.</dd>
                  </div>
                )}
                {offer!.price != null && (
                  <div>
                    <dt className="text-gray-500">Pris</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(offer!.price)}</dd>
                  </div>
                )}
                {offer!.included_description && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Inkluderet</dt>
                    <dd className="text-gray-700 whitespace-pre-wrap line-clamp-2">
                      {offer!.included_description}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {!hasOffer && (
              <p className="mt-2 text-sm text-amber-700">
                Spillersæt-skabelon er ikke sat op endnu.
              </p>
            )}
          </div>
          <Button type="button" variant="secondary" onClick={openModal}>
            {isAdmin ? (
              <>
                <Pencil className="h-4 w-4" />
                {hasOffer ? 'Rediger tilbud' : 'Opret tilbud'}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Se tilbud
              </>
            )}
          </Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={isAdmin ? 'Spillersæt-tilbud — skabelon' : 'Spillersæt-tilbud'}
      >
        <p className="text-sm text-gray-500 mb-4">
          Udfyld sætnavn, antal (stk.), pris og hvad der er inkluderet. Teksten bruges i mailen til
          kunden under hvert hold.
        </p>

        {isAdmin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Sætnavn"
              value={form.set_name}
              onChange={(e) => setForm({ ...form, set_name: e.target.value })}
              placeholder="Fx LunaLiga spillersæt"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Antal (stk.)"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Fx 4"
              />
              <Input
                label="Pris (DKK)"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Fx 599"
              />
            </div>
            <Textarea
              label="Inkluderet i sættet"
              value={form.included_description}
              onChange={(e) => setForm({ ...form, included_description: e.target.value })}
              rows={4}
              placeholder="Fx 2 Luna-ketcher, 3 bolde, taske med holdlogo..."
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" loading={saving}>
                Gem spillersæt-skabelon
              </Button>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Annuller
              </Button>
            </div>
          </form>
        ) : offer ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Sæt</dt>
              <dd className="font-medium text-gray-900">{offer.set_name}</dd>
            </div>
            {offer.quantity != null && (
              <div>
                <dt className="text-gray-500">Antal (stk.)</dt>
                <dd className="font-medium text-gray-900">{offer.quantity} stk.</dd>
              </div>
            )}
            {offer.price != null && (
              <div>
                <dt className="text-gray-500">Pris</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(offer.price)}</dd>
              </div>
            )}
            {offer.included_description && (
              <div>
                <dt className="text-gray-500">Inkluderet</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">{offer.included_description}</dd>
              </div>
            )}
            <Button type="button" variant="secondary" onClick={closeModal}>
              Luk
            </Button>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">Spillersæt-skabelon er ikke sat op endnu.</p>
        )}
      </Modal>
    </>
  )
}
