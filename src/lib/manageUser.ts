import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export interface UpdateUserInput {
  id: string
  email?: string
  password?: string
  full_name?: string
  role?: UserRole
  approved?: boolean
}

async function invokeAdminFunction(
  name: string,
  body: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    return { error: error.message }
  }

  const payload = data as { error?: string } | null
  if (payload?.error) {
    return { error: payload.error }
  }

  return { error: null }
}

export async function updateUserAsAdmin(
  input: UpdateUserInput,
): Promise<{ error: string | null }> {
  const body: Record<string, unknown> = { id: input.id }
  if (input.email !== undefined) body.email = input.email
  if (input.password) body.password = input.password
  if (input.full_name !== undefined) body.full_name = input.full_name
  if (input.role !== undefined) body.role = input.role
  if (input.approved !== undefined) body.approved = input.approved

  return invokeAdminFunction('update-user', body)
}

export async function deleteUserAsAdmin(id: string): Promise<{ error: string | null }> {
  return invokeAdminFunction('delete-user', { id })
}
