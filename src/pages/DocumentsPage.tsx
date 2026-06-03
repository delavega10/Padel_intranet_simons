import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Plus } from 'lucide-react'
import { supabase, DOCUMENTS_BUCKET } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardMeta, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatDate, formatFileSize } from '@/lib/format'
import { DOCUMENT_CATEGORY_LABELS, type Document, type DocumentCategory } from '@/types'

export function DocumentsPage() {
  const { isAdmin } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (category !== 'all') query = query.eq('category', category)

    query.then(({ data }) => {
      if (data) setDocuments(data as Document[])
      setLoading(false)
    })
  }, [category])

  async function downloadDoc(doc: Document) {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.file_path, 60)

    if (error || !data?.signedUrl) {
      alert('Kunne ikke hente filen: ' + (error?.message ?? 'Ukendt fejl'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Dokumenter"
        description="Policies, træningsmateriale og klubdokumenter"
        icon={FileText}
        action={
          isAdmin ? (
            <Link to="/admin?tab=documents">
              <Button>
                <Plus className="h-4 w-4" />
                Upload
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 max-w-xs">
        <Select
          label="Kategori"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory | 'all')}
        >
          <option value="all">Alle kategorier</option>
          {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {DOCUMENT_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
      </div>

      {documents.length === 0 ? (
        <EmptyState title="Ingen dokumenter" description="Der er ingen dokumenter i denne kategori." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardTitle>{doc.title}</CardTitle>
              <CardMeta>
                {DOCUMENT_CATEGORY_LABELS[doc.category]} · {formatDate(doc.created_at)}
                {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ''}
              </CardMeta>
              <p className="mt-1 truncate text-xs text-gray-500">{doc.file_name}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => downloadDoc(doc)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
