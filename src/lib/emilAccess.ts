import type { Profile } from '@/types'

/** Matcher samme logik som public.is_emil() i databasen. */
export function isEmilProfile(profile: Profile | null | undefined): boolean {
  if (!profile?.approved) return false
  const emailLocal = profile.email.split('@')[0]?.toLowerCase() ?? ''
  const name = profile.full_name?.toLowerCase().trim() ?? ''
  return emailLocal === 'emil' || name === 'emil' || name.startsWith('emil ')
}
