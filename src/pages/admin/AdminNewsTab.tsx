import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import type { News } from '@/types'

const emptyForm = {
  title: '',
  content: '',
  published_at: new Date().toISOString().slice(0, 10),
  author_name: '',
}

export function AdminNewsTab() {
  const { profile } = useAuth()
  const [items, setItems] = useState<News[]>([])
  const [form, setForm] = useState({ ...emptyForm, author_name: profile?.full_name ?? '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    if (data) setItems(data as News[])
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (profile?.full_name && !editingId) {
      setForm((f) => ({ ...f, author_name: profile.full_name ?? f.author_name }))
    }
  }, [profile, editingId])

  function startEdit(item: News) {
    setEditingId(item.id)
    setForm({
      title: item.title ?? '',
      content: item.content,
      published_at: item.published_at,
      author_name: item.author_name,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title || form.content.slice(0, 80),
      content: form.content,
      published_at: form.published_at,
      author_name: form.author_name,
      author_id: profile?.id,
      images: [],
      link_previews: [],
    }

    if (editingId) {
      await supabase.from('news').update(payload).eq('id', editingId)
    } else {
      await supabase.from('news').insert(payload)
    }

    setSaving(false)
    setEditingId(null)
    setForm({ ...emptyForm, author_name: profile?.full_name ?? '' })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Slet denne nyhed?')) return
    await supabase.from('news').delete().eq('id', id)
    await load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold text-gray-900 normal-case">{editingId ? 'Rediger nyhed' : 'Opret nyhed'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Titel" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dato" type="date" required value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
            <Input label="Forfatter" required value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
          </div>
          <Textarea label="Indhold" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>{editingId ? 'Gem' : 'Opret'}</Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm({ ...emptyForm, author_name: profile?.full_name ?? '' }) }}>
                Annuller
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{item.title}</CardTitle>
              <p className="text-sm text-gray-500">{formatDate(item.published_at)} · {item.author_name}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-900/30">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
