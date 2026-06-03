import { ExternalLink } from 'lucide-react'
import type { NewsLinkPreview } from '@/types'

export function LinkPreviewCard({ preview }: { preview: NewsLinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:border-padel-300 hover:bg-padel-50/30 transition-colors"
    >
      {preview.image ? (
        <img
          src={preview.image}
          alt=""
          className="h-16 w-16 shrink-0 rounded object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-padel-100">
          <ExternalLink className="h-6 w-6 text-padel-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-gray-900 line-clamp-2">{preview.title}</p>
        {preview.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">{preview.description}</p>
        )}
        <p className="mt-1 text-xs text-padel-600 truncate">{preview.siteName || preview.url}</p>
      </div>
    </a>
  )
}
