import { useRef, useState } from 'react'
import { Camera, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { uploadAvatar } from '@/lib/avatars'
import { Avatar } from '@/components/ui/Avatar'
import { ROLE_LABELS } from '@/types'

/** Profilboks i bunden af sidemenuen: avatar-upload, navn, tema-skifter og log ud. */
export function SidebarProfile() {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(file: File | undefined) {
    if (!file || !user) return
    setUploading(true)
    setError(null)

    const { error: uploadError } = await uploadAvatar(user.id, file)

    setUploading(false)
    if (uploadError) {
      setError(uploadError)
      return
    }
    setAvatarVersion(Date.now())
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative shrink-0 rounded-full"
          title="Skift profilbillede"
          aria-label="Skift profilbillede"
        >
          <Avatar
            userId={user?.id}
            name={profile?.full_name ?? profile?.email}
            version={avatarVersion}
            className="h-10 w-10 text-sm"
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-4 w-4 text-white" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {profile?.full_name ?? profile?.email}
          </p>
          <p className="text-xs text-gray-500">
            {profile?.role ? ROLE_LABELS[profile.role] : ''}
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-padel-700"
          aria-label={theme === 'dark' ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Lyst' : 'Mørkt'}
        </button>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-padel-700"
        >
          <LogOut className="h-4 w-4" />
          Log ud
        </button>
      </div>
    </div>
  )
}
