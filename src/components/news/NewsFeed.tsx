import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteNewsImage } from '@/lib/newsMedia'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { NewsFeedComposer } from './NewsFeedComposer'
import { NewsFeedPost } from './NewsFeedPost'
import type { News, NewsImage, NewsLinkPreview } from '@/types'

function normalizeNews(row: Record<string, unknown>): News {
  return {
    ...(row as unknown as News),
    title: (row.title as string | null) ?? null,
    images: (row.images as NewsImage[]) ?? [],
    link_previews: (row.link_previews as NewsLinkPreview[]) ?? [],
  }
}

interface NewsFeedProps {
  limit?: number
  showComposer?: boolean
  showHeader?: boolean
}

export function NewsFeed({ limit, showComposer = true, showHeader = true }: NewsFeedProps) {
  const [posts, setPosts] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  const loadPosts = useCallback(async () => {
    let query = supabase.from('news').select('*').order('created_at', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Kunne ikke hente feed:', error.message)
    } else if (data) {
      setPosts(data.map((row) => normalizeNews(row as Record<string, unknown>)))
    }
    setLoading(false)
  }, [limit])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  async function handleDelete(id: string) {
    if (!confirm('Slet dette indlæg?')) return

    const post = posts.find((p) => p.id === id)
    if (post?.images?.length) {
      for (const img of post.images) {
        await deleteNewsImage(img.path)
      }
    }

    await supabase.from('news').delete().eq('id', id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {showHeader && (
        <h2 className="text-lg font-semibold text-gray-900 normal-case">Nyhedsfeed</h2>
      )}

      {showComposer && <NewsFeedComposer onPosted={loadPosts} />}

      {posts.length === 0 ? (
        <EmptyState
          title="Ingen indlæg endnu"
          description="Vær den første til at dele noget med klubben."
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <NewsFeedPost key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
