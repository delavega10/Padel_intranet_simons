import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase, DOCUMENTS_BUCKET } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardTitle } from '@/components/ui/Card'
import { DOCUMENT_CATEGORY_LABELS, type Document, type DocumentCategory } from '@/types'
import { formatDate } from '@/lib/format'

export function AdminDocumentsTab() {
  const { user } = useAuth()
  const [items, setItems] = useState<Document[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('personale')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (data) setItems(data as Document[])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!file || !user) return

    setUploading(true)
    const filePath = `${category}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file)

    if (uploadError) {
      alert('Upload fejlede: ' + uploadError.message)
      setUploading(false)
      return
    }

    await supabase.from('documents').insert({
      title,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })

    setTitle('')
    setFile(null)
    setUploading(false)
    await load()
  }

  async function handleDelete(doc: Document) {
    if (!confirm('Slet dette dokument?')) return
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    await load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold text-gray-900 normal-case">Upload dokument</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <Input label="Titel" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select label="Kategori" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
            {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {DOCUMENT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fil</label>
            <input
              type="file"
              required
              className="w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-padel-700 file:px-4 file:py-2 file:text-white"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" loading={uploading}>Upload</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{item.title}</CardTitle>
              <p className="text-sm text-gray-500">
                {DOCUMENT_CATEGORY_LABELS[item.category]} · {formatDate(item.created_at)}
              </p>
            </div>
            <button type="button" onClick={() => handleDelete(item)} className="rounded-lg p-2 text-red-400 hover:bg-red-900/30">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
