import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export interface CreateUserInput {
  email: string
  password: string
  full_name: string
  role: UserRole
  approved: boolean
}

export async function createUserAsAdmin(
  input: CreateUserInput,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: input,
  })

  if (error) {
    return { error: error.message }
  }

  const payload = data as { error?: string } | null
  if (payload?.error) {
    return { error: payload.error }
  }

  return { error: null }
}
