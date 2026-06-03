import { supabase, NEWS_MEDIA_BUCKET } from '@/lib/supabase'
import type { NewsImage } from '@/types'

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

export async function uploadNewsImage(
  file: File,
  userId: string,
): Promise<{ image: NewsImage | null; error: string | null }> {
  const path = `${userId}/${Date.now()}-${safeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(NEWS_MEDIA_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { image: null, error: uploadError.message }
  }

  const { data: publicData } = supabase.storage.from(NEWS_MEDIA_BUCKET).getPublicUrl(path)

  return {
    image: {
      path,
      filename: file.name,
      url: publicData.publicUrl,
    },
    error: null,
  }
}

export async function uploadNewsImages(
  files: File[],
  userId: string,
): Promise<{ images: NewsImage[]; errors: string[] }> {
  const images: NewsImage[] = []
  const errors: string[] = []

  for (const file of files) {
    const result = await uploadNewsImage(file, userId)
    if (result.image) images.push(result.image)
    if (result.error) errors.push(`${file.name}: ${result.error}`)
  }

  return { images, errors }
}

/** Opdater URL hvis bucket var privat tidligere */
export async function refreshImageUrls(images: NewsImage[]): Promise<NewsImage[]> {
  return images.map((img) => {
    const { data } = supabase.storage.from(NEWS_MEDIA_BUCKET).getPublicUrl(img.path)
    return { ...img, url: data.publicUrl || img.url }
  })
}

export async function deleteNewsImage(path: string): Promise<void> {
  await supabase.storage.from(NEWS_MEDIA_BUCKET).remove([path])
}
