import { useEffect, useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { refreshImageUrls } from '@/lib/newsMedia'
import { formatDate } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { LinkPreviewCard } from './LinkPreviewCard'
import type { News } from '@/types'

function linkifyContent(text: string, previewUrls: string[]) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/gi)
  const nodes: ReactNode[] = []
  parts.forEach((part, i) => {
    if (/^https?:\/\//i.test(part)) {
      const href = part.replace(/[.,;:!?)]+$/, '')
      if (!previewUrls.some((u) => u === href || href.startsWith(u))) {
        nodes.push(
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-padel-600 hover:underline break-all"
          >
            {part}
          </a>,
        )
      }
    } else if (part) {
      nodes.push(<span key={i}>{part}</span>)
    }
  })
  return nodes
}

interface NewsFeedPostProps {
  post: News
  onDelete?: (id: string) => void
}

export function NewsFeedPost({ post, onDelete }: NewsFeedPostProps) {
  const { user, isAdmin } = useAuth()
  const [images, setImages] = useState(post.images ?? [])
  const canDelete = isAdmin || post.author_id === user?.id

  const previewUrls = (post.link_previews ?? []).map((p) => p.url)

  useEffect(() => {
    if (post.images?.length) {
      refreshImageUrls(post.images).then(setImages)
    }
  }, [post.images])

  const displayDate = post.created_at || post.published_at
  const showTitle =
    post.title &&
    post.content &&
    post.title !== post.content.slice(0, 80) &&
    !post.content.startsWith(post.title)

  return (
    <article className="content-card overflow-hidden p-0">
      <div className="p-4 pb-0">
        <div className="flex gap-3">
          <Avatar userId={post.author_id} name={post.author_name} className="h-12 w-12 text-sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{post.author_name}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(displayDate.slice(0, 10))}
                </p>
              </div>
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Slet indlæg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {showTitle && (
              <h3 className="mt-3 font-semibold text-gray-900 normal-case">{post.title}</h3>
            )}

            {post.content && (
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed normal-case">
                {linkifyContent(post.content, previewUrls)}
              </div>
            )}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className={`mt-3 ${images.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
          {images.map((img) => (
            <a
              key={img.path}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-100"
            >
              <img
                src={img.url}
                alt={img.filename}
                className="w-full max-h-[420px] object-cover"
                onError={(e) => {
                  e.currentTarget.alt = 'Billede kunne ikke vises'
                }}
              />
            </a>
          ))}
        </div>
      )}

      {post.link_previews?.length > 0 && (
        <div className="space-y-2 p-4 pt-3">
          {post.link_previews.map((preview) => (
            <LinkPreviewCard key={preview.url} preview={preview} />
          ))}
        </div>
      )}
    </article>
  )
}
