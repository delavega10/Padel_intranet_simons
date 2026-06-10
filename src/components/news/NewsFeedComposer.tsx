import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { ImagePlus, Link2, Loader2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  buildLinkPreviewFallback,
  extractUrls,
  isValidUrl,
  mergeLinkPreviews,
  normalizeUrl,
  resolveLinkPreviews,
  type LinkPreviewData,
} from '@/lib/linkPreview'
import { uploadNewsImage } from '@/lib/newsMedia'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LinkPreviewCard } from './LinkPreviewCard'
import type { NewsImage } from '@/types'

const MAX_IMAGE_MB = 10

interface AttachedImage extends NewsImage {
  localPreview?: string
}

interface NewsFeedComposerProps {
  onPosted: () => void
}

export function NewsFeedComposer({ onPosted }: NewsFeedComposerProps) {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<AttachedImage[]>([])
  const [manualLinks, setManualLinks] = useState<LinkPreviewData[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewData[]>([])
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const authorName = profile?.full_name || profile?.email?.split('@')[0] || 'Bruger'

  const canPost =
    content.trim().length > 0 || images.length > 0 || linkPreviews.length > 0

  function updateLinkPreviews(text: string, manual: LinkPreviewData[]) {
    setLinkPreviews(mergeLinkPreviews(text, manual))
  }

  function handleContentChange(text: string) {
    setContent(text)
    updateLinkPreviews(text, manualLinks)
  }

  async function addImageFiles(fileList: FileList | File[]) {
    if (!user) return
    const list = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) {
      setError('Kun billedfiler understøttes (JPG, PNG, osv.)')
      return
    }

    setError(null)
    setUploading(true)
    setExpanded(true)

    for (const file of list) {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`"${file.name}" er for stor (maks ${MAX_IMAGE_MB} MB)`)
        continue
      }

      const localPreview = URL.createObjectURL(file)
      const tempId = `temp-${Date.now()}-${file.name}`
      setImages((prev) => [
        ...prev,
        { path: tempId, filename: file.name, url: localPreview, localPreview },
      ])

      const { image, error: uploadError } = await uploadNewsImage(file, user.id)

      if (uploadError || !image) {
        setImages((prev) => prev.filter((i) => i.path !== tempId))
        URL.revokeObjectURL(localPreview)
        setError(uploadError ?? 'Upload fejlede')
        continue
      }

      setImages((prev) =>
        prev.map((i) =>
          i.path === tempId
            ? { ...image, localPreview }
            : i,
        ),
      )
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const img = prev[index]
      if (img?.localPreview) URL.revokeObjectURL(img.localPreview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function addLink() {
    const raw = linkInput.trim()
    if (!raw) return
    if (!isValidUrl(raw)) {
      setError('Indtast en gyldig webadresse (f.eks. https://eksempel.dk)')
      return
    }
    const normalized = normalizeUrl(raw)
    if (manualLinks.some((l) => l.url === normalized)) {
      setLinkInput('')
      setShowLinkInput(false)
      return
    }
    const added = buildLinkPreviewFallback(normalized)
    const nextManual = [...manualLinks.filter((l) => l.url !== normalized), added]
    setManualLinks(nextManual)
    updateLinkPreviews(content, nextManual)
    setLinkInput('')
    setShowLinkInput(false)
    setError(null)
    setExpanded(true)
  }

  function removeLink(url: string) {
    const nextManual = manualLinks.filter((l) => l.url !== url)
    setManualLinks(nextManual)
    updateLinkPreviews(content, nextManual)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addImageFiles(e.dataTransfer.files)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !canPost || uploading) return

    setPosting(true)
    setError(null)

    const readyImages = images.filter((i) => !i.path.startsWith('temp-'))
    if (images.length > 0 && readyImages.length !== images.length) {
      setError('Vent til alle billeder er uploadet')
      setPosting(false)
      return
    }

    const urls = extractUrls(content)
    const storedPreviews = await resolveLinkPreviews([
      ...linkPreviews.map((p) => p.url),
      ...urls,
    ])
    const uniquePreviews = mergeLinkPreviews('', storedPreviews)

    const text = content.trim()
    const title = text.split('\n')[0]?.slice(0, 80) || 'Indlæg'

    const { error: insertError } = await supabase.from('news').insert({
      title,
      content: text || (uniquePreviews[0] ? uniquePreviews[0].url : ''),
      published_at: new Date().toISOString().slice(0, 10),
      author_id: user.id,
      author_name: authorName,
      images: readyImages.map(({ path, filename, url }) => ({ path, filename, url })),
      link_previews: uniquePreviews,
    })

    setPosting(false)

    if (insertError) {
      setError('Kunne ikke publicere: ' + insertError.message)
      return
    }

    images.forEach((i) => i.localPreview && URL.revokeObjectURL(i.localPreview))
    setContent('')
    setImages([])
    setManualLinks([])
    setLinkPreviews([])
    setLinkInput('')
    setShowLinkInput(false)
    setExpanded(false)
    onPosted()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`content-card transition-colors ${dragOver ? 'ring-2 ring-padel-400 bg-padel-50/30' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex gap-3">
        <Avatar userId={user?.id} name={authorName} className="h-12 w-12 text-sm" />

        <div className="min-w-0 flex-1 space-y-3">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              Start et indlæg...
            </button>
          ) : (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Hvad vil du dele med klubben?"
              rows={4}
              autoFocus
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-padel-500 focus:outline-none focus:ring-2 focus:ring-padel-500/30"
            />
          )}

          {images.length > 0 && (
            <div
              className={`grid gap-2 overflow-hidden rounded-lg border border-gray-200 ${
                images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {images.map((img, index) => (
                <div key={img.path} className="relative bg-gray-100">
                  <img
                    src={img.localPreview || img.url}
                    alt={img.filename}
                    className="max-h-72 w-full object-cover"
                  />
                  {img.path.startsWith('temp-') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-gray-900/70 p-1.5 text-white hover:bg-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {linkPreviews.length > 0 && (
            <div className="space-y-2">
              {linkPreviews.map((preview) => (
                <div key={preview.url} className="relative">
                  <LinkPreviewCard preview={preview} />
                  <button
                    type="button"
                    onClick={() => removeLink(preview.url)}
                    className="absolute right-2 top-2 rounded-full bg-gray-900/70 p-1 text-white"
                    aria-label="Fjern link"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showLinkInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-padel-500 focus:outline-none focus:ring-2 focus:ring-padel-500/30"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
              />
              <Button type="button" variant="secondary" onClick={addLink}>
                Tilføj
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowLinkInput(false)
                  setLinkInput('')
                }}
              >
                Annuller
              </Button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {expanded && (
            <>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files) addImageFiles(e.target.files)
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-padel-700 disabled:opacity-50"
                    >
                      <ImagePlus className="h-5 w-5 text-padel-600" />
                      Billede
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(true)
                        setExpanded(true)
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-padel-700"
                    >
                      <Link2 className="h-5 w-5 text-padel-600" />
                      Link
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setExpanded(false)
                        setShowLinkInput(false)
                      }}
                    >
                      Annuller
                    </Button>
                    <Button
                      type="submit"
                      loading={posting}
                      disabled={!canPost || uploading}
                    >
                      Publicer
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Tip: Træk billeder hertil, eller indsæt et link i teksten / via Link-knappen
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
