import { supabase, EVENT_MARKETING_BUCKET } from '@/lib/supabase'

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

export async function uploadEventLogo(
  file: File,
  eventId: string,
): Promise<{ url: string; path: string; filename: string } | { error: string }> {
  const path = `${eventId}/${Date.now()}-${safeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(EVENT_MARKETING_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'image/png',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from(EVENT_MARKETING_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path, filename: file.name }
}

export async function deleteEventLogo(path: string): Promise<void> {
  await supabase.storage.from(EVENT_MARKETING_BUCKET).remove([path])
}
