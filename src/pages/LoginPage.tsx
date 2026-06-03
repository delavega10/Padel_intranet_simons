import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const { session, isApproved, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isApproved) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-padel-600 text-3xl font-bold text-white shadow-md">
            P
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 uppercase">Padel Intranet</h2>
          <p className="mt-2 text-gray-600 normal-case">Log ind med din klubkonto</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mailadresse"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-padel-500 focus:ring-2 focus:ring-padel-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Adgangskode
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Adgangskode"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-padel-500 focus:ring-2 focus:ring-padel-500/30 focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Log ind
          </Button>

          <p className="text-center text-xs text-gray-500 normal-case">
            Kun godkendte brugere har adgang. Kontakt admin hvis du mangler adgang.
          </p>
        </form>
      </div>
    </div>
  )
}
