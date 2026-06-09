import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ExternalLink,
  FolderPlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Collaboration, CollaborationCategory } from '@/types'

export function CollaborationsPage() {
  const { isAdmin } = useAuth()
  const [categories, setCategories] = useState<CollaborationCategory[]>([])
  const [contacts, setContacts] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')

  const [categoryName, setCategoryName] = useState('')

  const load = useCallback(async () => {
    const [catRes, contactRes] = await Promise.all([
      supabase.from('collaboration_categories').select('*').order('sort_order').order('name'),
      supabase.from('collaborations').select('*').order('sort_order').order('name'),
    ])
    if (catRes.data) setCategories(catRes.data as CollaborationCategory[])
    if (contactRes.data) setContacts(contactRes.data as Collaboration[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const contactsByCategory = useMemo(() => {
    const map = new Map<string, Collaboration[]>()
    for (const cat of categories) map.set(cat.id, [])
    for (const c of contacts) {
      const list = map.get(c.category_id)
      if (list) list.push(c)
    }
    return map
  }, [categories, contacts])

  function resetContactForm() {
    setContactModalOpen(false)
    setEditingContactId(null)
    setCategoryId(categories[0]?.id ?? '')
    setName('')
    setContactName('')
    setPhone('')
    setEmail('')
    setWebsiteUrl('')
    setNotes('')
  }

  function openCreateContact(preselectedCategoryId?: string) {
    setEditingContactId(null)
    setCategoryId(preselectedCategoryId ?? categories[0]?.id ?? '')
    setName('')
    setContactName('')
    setPhone('')
    setEmail('')
    setWebsiteUrl('')
    setNotes('')
    setContactModalOpen(true)
  }

  function startEditContact(c: Collaboration) {
    setEditingContactId(c.id)
    setCategoryId(c.category_id)
    setName(c.name)
    setContactName(c.contact_name ?? '')
    setPhone(c.phone ?? '')
    setEmail(c.email ?? '')
    setWebsiteUrl(c.website_url ?? '')
    setNotes(c.notes ?? '')
    setContactModalOpen(true)
  }

  function resetCategoryForm() {
    setCategoryModalOpen(false)
    setEditingCategoryId(null)
    setCategoryName('')
  }

  function openCreateCategory() {
    setEditingCategoryId(null)
    setCategoryName('')
    setCategoryModalOpen(true)
  }

  function startEditCategory(cat: CollaborationCategory) {
    setEditingCategoryId(cat.id)
    setCategoryName(cat.name)
    setCategoryModalOpen(true)
  }

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !name.trim() || !categoryId) return
    setSaving(true)

    const payload = {
      category_id: categoryId,
      name: name.trim(),
      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website_url: websiteUrl.trim() || null,
      notes: notes.trim() || null,
    }

    if (editingContactId) {
      await supabase.from('collaborations').update(payload).eq('id', editingContactId)
    } else {
      const inCategory = contacts.filter((c) => c.category_id === categoryId).length
      await supabase.from('collaborations').insert({ ...payload, sort_order: inCategory })
    }

    setSaving(false)
    resetContactForm()
    await load()
  }

  async function handleCategorySubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin || !categoryName.trim()) return
    setSaving(true)

    if (editingCategoryId) {
      await supabase
        .from('collaboration_categories')
        .update({ name: categoryName.trim() })
        .eq('id', editingCategoryId)
    } else {
      await supabase.from('collaboration_categories').insert({
        name: categoryName.trim(),
        sort_order: categories.length,
      })
    }

    setSaving(false)
    resetCategoryForm()
    await load()
  }

  async function deleteContact(id: string) {
    if (!isAdmin || !confirm('Slet kontakt?')) return
    await supabase.from('collaborations').delete().eq('id', id)
    if (editingContactId === id) resetContactForm()
    await load()
  }

  async function deleteCategory(id: string) {
    if (!isAdmin) return
    const count = contacts.filter((c) => c.category_id === id).length
    const msg =
      count > 0
        ? `Slet kategori og ${count} kontakt${count === 1 ? '' : 'er'}?`
        : 'Slet tom kategori?'
    if (!confirm(msg)) return
    await supabase.from('collaboration_categories').delete().eq('id', id)
    if (editingCategoryId === id) resetCategoryForm()
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Samarbejde"
        description="Kontakter og samarbejdspartnere — opdelt i kategorier, så I ved hvem der skal kontaktes"
        icon={Users}
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={openCreateCategory}>
                <FolderPlus className="h-4 w-4" />
                Ny kategori
              </Button>
              <Button
                type="button"
                onClick={() => openCreateContact()}
                disabled={categories.length === 0}
              >
                <Plus className="h-4 w-4" />
                Tilføj kontakt
              </Button>
            </div>
          ) : undefined
        }
      />

      {isAdmin && (
        <>
          <Modal
            open={contactModalOpen}
            onClose={resetContactForm}
            title={editingContactId ? 'Rediger kontakt' : 'Tilføj kontakt'}
          >
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <Select
                label="Kategori"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Navn / virksomhed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fx Matchi, REMA 1000"
                required
              />
              <Input
                label="Kontaktperson (valgfrit)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Fx Peter Hansen"
              />
              <Input
                label="Telefon (valgfrit)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 ..."
              />
              <Input
                label="E-mail (valgfrit)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kontakt@..."
              />
              <Input
                label="Hjemmeside (valgfrit)"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
              <Textarea
                label="Noter (valgfrit)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hvad samarbejder I om? Hvornår kontaktes de typisk?"
                rows={3}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" loading={saving}>
                  {editingContactId ? 'Gem ændringer' : 'Tilføj kontakt'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetContactForm}>
                  Annuller
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            open={categoryModalOpen}
            onClose={resetCategoryForm}
            title={editingCategoryId ? 'Rediger kategori' : 'Ny kategori'}
          >
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <Input
                label="Kategorinavn"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Fx Trænere, Turneringer, Leverandører"
                required
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" loading={saving}>
                  {editingCategoryId ? 'Gem kategori' : 'Opret kategori'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetCategoryForm}>
                  Annuller
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {categories.length === 0 ? (
        <EmptyState
          title="Ingen kategorier endnu"
          description={
            isAdmin
              ? 'Opret en kategori først — fx Trænere, Turneringer eller Leverandører.'
              : 'Listen er tom — kontakt admin.'
          }
        />
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const items = contactsByCategory.get(cat.id) ?? []
            return (
              <section key={cat.id}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 normal-case">{cat.name}</h2>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openCreateContact(cat.id)}
                        className="rounded-lg px-2.5 py-1.5 text-sm text-padel-600 hover:bg-padel-50"
                      >
                        + Kontakt
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditCategory(cat)}
                        className="rounded p-2 text-gray-400 hover:text-padel-700 hover:bg-gray-100"
                        aria-label="Rediger kategori"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="Slet kategori"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
                    Ingen kontakter i denne kategori endnu.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((c) => (
                      <Card key={c.id} className="flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            {c.contact_name && (
                              <p className="text-sm text-gray-600 mt-0.5">{c.contact_name}</p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => startEditContact(c)}
                                className="rounded p-2 text-gray-400 hover:text-padel-700 hover:bg-gray-100"
                                aria-label="Rediger"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteContact(c.id)}
                                className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                aria-label="Slet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {c.phone && (
                            <a
                              href={`tel:${c.phone.replace(/\s/g, '')}`}
                              className="flex items-center gap-2 text-sm text-padel-600 hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {c.phone}
                            </a>
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="flex items-center gap-2 text-sm text-padel-600 hover:underline break-all"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {c.email}
                            </a>
                          )}
                          {c.website_url && (
                            <a
                              href={c.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-padel-600 hover:underline break-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              Hjemmeside
                            </a>
                          )}
                        </div>

                        {c.notes && (
                          <p className="mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
                            {c.notes}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
