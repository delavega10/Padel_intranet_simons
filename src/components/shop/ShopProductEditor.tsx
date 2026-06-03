import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { ShopProduct } from '@/types'

interface ShopProductEditorProps {
  products: ShopProduct[]
  onChanged: () => void
}

export function ShopProductEditor({ products, onChanged }: ShopProductEditorProps) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('shop_products').insert({
      name: newName.trim(),
      tile_color: 'green',
      sort_order: products.length + 1,
    })
    setNewName('')
    setSaving(false)
    onChanged()
  }

  function startEdit(p: ShopProduct) {
    setEditingId(p.id)
    setEditName(p.name)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('shop_products').update({ name: editName.trim() }).eq('id', id)
    setEditingId(null)
    setSaving(false)
    onChanged()
  }

  async function deactivateProduct(id: string) {
    if (!confirm('Skjul varen fra huskesedlen?')) return
    setSaving(true)
    await supabase.from('shop_products').update({ active: false }).eq('id', id)
    await supabase.from('shop_reminder_items').delete().eq('product_id', id)
    setSaving(false)
    onChanged()
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4 normal-case">Rediger produkter</h3>
      <form onSubmit={addProduct} className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            label="Ny vare"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Navn på vare"
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" loading={saving}>
            <Plus className="h-4 w-4" />
            Tilføj
          </Button>
        </div>
      </form>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm"
          >
            {editingId === p.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-2 py-1"
                />
                <Button
                  type="button"
                  className="!py-1 !px-2 text-xs"
                  loading={saving}
                  onClick={() => saveEdit(p.id)}
                >
                  Gem
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Annuller
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-gray-800">{p.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="rounded p-1 text-gray-400 hover:text-padel-700"
                  aria-label="Rediger"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deactivateProduct(p.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-600"
                  aria-label="Slet"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
