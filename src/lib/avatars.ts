import { supabase } from '@/lib/supabase'

const MAX_AVATAR_MB = 2

/** Offentlig URL til en brugers profilbillede (filnavn = bruger-id). */
export function avatarUrl(userId: string, version?: number): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(userId)
  return version ? `${data.publicUrl}?v=${version}` : data.publicUrl
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ error: string | null }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'Vælg en billedfil' }
  }
  if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
    return { error: `Billedet må højst være ${MAX_AVATAR_MB} MB` }
  }

  const { error } = await supabase.storage.from('avatars').upload(userId, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '300',
  })

  return { error: error?.message ?? null }
}
