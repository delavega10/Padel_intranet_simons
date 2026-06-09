import type { Profile } from '@/types'

/** Interne sider Emil må se (admin ser alt). */
export const EMIL_ALLOWED_PATHS: string[] = ['/', '/kalender', '/emil']

/** Matcher samme logik som public.is_emil() i databasen. */
export function isEmilProfile(profile: Profile | null | undefined): boolean {
  if (!profile?.approved) return false
  const emailLocal = profile.email.split('@')[0]?.toLowerCase() ?? ''
  const name = profile.full_name?.toLowerCase().trim() ?? ''
  return emailLocal === 'emil' || name === 'emil' || name.startsWith('emil ')
}

export function isEmilOnlyUser(isEmil: boolean, isAdmin: boolean): boolean {
  return isEmil && !isAdmin
}
