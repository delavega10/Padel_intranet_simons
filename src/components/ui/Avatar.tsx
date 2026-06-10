import { useState } from 'react'
import { avatarUrl } from '@/lib/avatars'

function getInitials(name: string | null | undefined): string {
  const source = name?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

interface AvatarProps {
  userId: string | null | undefined
  name: string | null | undefined
  className?: string
  /** Bump for at genindlæse billedet efter upload */
  version?: number
}

/** Profilbillede med initialer som fallback. */
export function Avatar({ userId, name, className = 'h-10 w-10 text-sm', version }: AvatarProps) {
  // Nulstilles automatisk når userId/version ændres, da nøglen ikke længere matcher
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const imageKey = `${userId}-${version ?? 0}`
  const failed = failedKey === imageKey

  if (!userId || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-padel-100 font-semibold text-padel-700 ${className}`}
      >
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={avatarUrl(userId, version)}
      alt={name ?? 'Profilbillede'}
      onError={() => setFailedKey(imageKey)}
      className={`shrink-0 rounded-full object-cover bg-padel-100 ${className}`}
    />
  )
}
