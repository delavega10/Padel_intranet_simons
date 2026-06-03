import { useCallback, useEffect, useState } from 'react'
import { Check, ClipboardList, Copy, ListTodo, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { ShopProductEditor } from '@/components/shop/ShopProductEditor'
import type { ShopProduct } from '@/types'

type ReminderQty = Record<string, number>
type ReminderCompleted = Record<string, boolean>
type PageTab = 'seddel' | 'rediger'

export function OrdersPage() {
  const { profile, isAdmin } = useAuth()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [quantities, setQuantities] = useState<ReminderQty>({})
  const [completed, setCompleted] = useState<ReminderCompleted>({})
  const [note, setNote] = useState('')
  const [updatedBy, setUpdatedBy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<PageTab>('seddel')

  const authorName = profile?.full_name || profile?.email?.split('@')[0] || 'Bruger'

  const load = useCallback(async () => {
    const [prodRes, itemsRes, noteRes] = await Promise.all([
      supabase.from('shop_products').select('*').eq('active', true).order('sort_order'),
      supabase.from('shop_reminder_items').select('product_id, quantity, completed'),
      supabase.from('shop_reminder').select('note, updated_by_name').eq('id', 1).maybeSingle(),
    ])

    if (prodRes.data) setProducts(prodRes.data as ShopProduct[])

    const qty: ReminderQty = {}
    const done: ReminderCompleted = {}
    itemsRes.data?.forEach((row) => {
      qty[row.product_id] = row.quantity
      done[row.product_id] = row.completed ?? false
    })
    setQuantities(qty)
    setCompleted(done)

    if (noteRes.data) {
      setNote(noteRes.data.note ?? '')
      setUpdatedBy(noteRes.data.updated_by_name)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  const listLines = products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      product: p,
      qty: quantities[p.id],
      done: completed[p.id] ?? false,
    }))

  const activeLines = listLines.filter((l) => !l.done)
  const totalCount = listLines.reduce((sum, l) => sum + l.qty, 0)

  async function upsertReminderItem(
    productId: string,
    qty: number,
    isCompleted?: boolean,
  ) {
    setSaving(true)
    if (qty <= 0) {
      await supabase.from('shop_reminder_items').delete().eq('product_id', productId)
      setQuantities((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      setCompleted((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    } else {
      const row: {
        product_id: string
        quantity: number
        updated_at: string
        completed?: boolean
      } = {
        product_id: productId,
        quantity: qty,
        updated_at: new Date().toISOString(),
      }
      if (isCompleted !== undefined) row.completed = isCompleted
      await supabase.from('shop_reminder_items').upsert(row)
      setQuantities((prev) => ({ ...prev, [productId]: qty }))
      if (isCompleted !== undefined) {
        setCompleted((prev) => ({ ...prev, [productId]: isCompleted }))
      }
    }
    setSaving(false)
  }

  function addProduct(productId: string) {
    const next = (quantities[productId] ?? 0) + 1
    upsertReminderItem(productId, next, completed[productId] ?? false)
  }

  function changeQty(productId: string, delta: number) {
    const next = (quantities[productId] ?? 0) + delta
    upsertReminderItem(productId, next, completed[productId] ?? false)
  }

  async function toggleCompleted(productId: string) {
    const qty = quantities[productId] ?? 0
    if (qty <= 0) return
    const next = !completed[productId]
    await upsertReminderItem(productId, qty, next)
  }

  async function saveNote() {
    setSaving(true)
    await supabase.from('shop_reminder').upsert({
      id: 1,
      note: note.trim(),
      updated_by_name: authorName,
      updated_at: new Date().toISOString(),
    })
    setUpdatedBy(authorName)
    setSaving(false)
  }

  async function clearAll() {
    if (!confirm('Ryd hele huskesedlen for alle?')) return
    setSaving(true)
    await supabase.from('shop_reminder_items').delete().not('product_id', 'is', null)
    await supabase.from('shop_reminder').upsert({
      id: 1,
      note: '',
      updated_by_name: authorName,
      updated_at: new Date().toISOString(),
    })
    setQuantities({})
    setCompleted({})
    setNote('')
    setSaving(false)
    await load()
  }

  function buildListText() {
    const lines = activeLines.map(({ product, qty }) => `${qty}× ${product.name}`)
    if (note.trim()) lines.push('', 'Note:', note.trim())
    return lines.join('\n')
  }

  async function copyList() {
    const text = buildListText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Huskeseddel"
        description={
          activeTab === 'seddel'
            ? 'Vælg varer ovenfor — de vises i todo-listen nedenunder'
            : 'Tilføj, rediger eller skjul varer på huskesedlen'
        }
        icon={ClipboardList}
      />

      {isAdmin && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('seddel')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'seddel'
                ? 'bg-padel-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Huskeseddel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rediger')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'rediger'
                ? 'bg-padel-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Pencil className="h-4 w-4" />
            Rediger produkter
          </button>
        </div>
      )}

      {activeTab === 'rediger' && isAdmin && (
        <ShopProductEditor
          products={products}
          onChanged={() => {
            setLoading(true)
            load()
          }}
        />
      )}

      {(activeTab === 'seddel' || !isAdmin) && (
      <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 normal-case">Alle varer</h2>
        <p className="text-sm text-gray-600">Klik på en vare for at tilføje den til listen nedenunder.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const qty = quantities[product.id] ?? 0
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product.id)}
                disabled={saving}
                className={`relative flex min-h-[88px] flex-col items-center justify-center rounded-lg px-2 py-3 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-green-800 active:scale-[0.98] sm:text-sm ${
                  qty > 0
                    ? 'bg-green-800 ring-2 ring-white ring-offset-2 ring-offset-green-700'
                    : 'bg-green-700'
                }`}
              >
                {qty > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-padel-700 shadow">
                    {qty}
                  </span>
                )}
                <span className="line-clamp-3">{product.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 normal-case flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-padel-600" />
          Todo-liste — skal bestilles
          {totalCount > 0 && (
            <span className="rounded-full bg-padel-100 px-2.5 py-0.5 text-sm font-medium text-padel-800">
              {totalCount}
            </span>
          )}
        </h2>

        {listLines.length === 0 ? (
          <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
            Ingen varer valgt endnu — klik på varer ovenfor.
          </p>
        ) : (
          <>
            <Card className="space-y-1 p-0 overflow-hidden max-w-2xl">
              <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
                <p className="text-sm text-gray-500">
                  {activeLines.length} aktiv · {listLines.length - activeLines.length} færdig
                </p>
              </div>
              <ul className="divide-y divide-gray-100">
                {listLines.map(({ product, qty, done }) => (
                  <li
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 ${done ? 'bg-gray-50/80' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCompleted(product.id)}
                      disabled={saving}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        done
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-gray-300 bg-white hover:border-padel-500'
                      }`}
                      aria-label={done ? 'Marker som ikke bestilt' : 'Marker som bestilt'}
                    >
                      {done && <Check className="h-4 w-4" />}
                    </button>
                    <p
                      className={`min-w-0 flex-1 text-sm font-medium ${
                        done ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, -1)}
                        disabled={saving}
                        className="rounded p-1 hover:bg-gray-100"
                        aria-label="Fjern en"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, 1)}
                        disabled={saving}
                        className="rounded p-1 hover:bg-gray-100"
                        aria-label="Tilføj en"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex flex-wrap gap-2 max-w-2xl">
              <Button
                type="button"
                variant="secondary"
                disabled={activeLines.length === 0 && !note.trim()}
                onClick={copyList}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Kopieret!' : 'Kopiér aktiv liste'}
              </Button>
              <button
                type="button"
                onClick={clearAll}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Ryd alt
              </button>
            </div>
          </>
        )}

        <Card className="max-w-2xl">
          <Textarea
            label="Ekstra note til alle"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="fx bestil til turnering lørdag, husk lime..."
            rows={3}
            disabled={saving}
          />
          {updatedBy && (
            <p className="mt-2 text-xs text-gray-500">Sidst redigeret af {updatedBy}</p>
          )}
        </Card>
      </section>
      </>
      )}
    </div>
  )
}
