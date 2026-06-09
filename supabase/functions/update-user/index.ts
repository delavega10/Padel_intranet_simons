import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ROLES = ['admin', 'traener', 'medarbejder']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminCheck = await requireAdmin(req)
    if ('error' in adminCheck) return adminCheck.error

    const body = await req.json()
    const userId = String(body.id ?? '').trim()
    if (!userId) {
      return json({ error: 'Manglende bruger-id' }, 400)
    }

    const fullName =
      body.full_name !== undefined ? String(body.full_name).trim() : undefined
    const email =
      body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined
    const password = body.password !== undefined ? String(body.password) : undefined
    const role = body.role !== undefined ? String(body.role) : undefined
    const approved = body.approved !== undefined ? Boolean(body.approved) : undefined

    if (email !== undefined && !email) {
      return json({ error: 'E-mail er påkrævet' }, 400)
    }

    if (password !== undefined && password.length > 0 && password.length < 6) {
      return json({ error: 'Adgangskode skal være mindst 6 tegn' }, 400)
    }

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return json({ error: 'Ugyldig rolle' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authUpdates: {
      email?: string
      password?: string
      user_metadata?: { full_name: string }
    } = {}

    if (email) authUpdates.email = email
    if (password && password.length >= 6) authUpdates.password = password
    if (fullName !== undefined) {
      authUpdates.user_metadata = {
        full_name: fullName || email?.split('@')[0] || 'bruger',
      }
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates,
      )
      if (authError) return json({ error: authError.message }, 400)
    }

    const profileUpdates: Record<string, unknown> = {}
    if (fullName !== undefined) profileUpdates.full_name = fullName || null
    if (email) profileUpdates.email = email
    if (role !== undefined) profileUpdates.role = role
    if (approved !== undefined) profileUpdates.approved = approved

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (profileError) return json({ error: profileError.message }, 400)
    }

    return json({ id: userId })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Ukendt fejl' }, 500)
  }
})

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { error: json({ error: 'Manglende autorisation' }, 401) }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser()

  if (userError || !user) {
    return { error: json({ error: 'Ugyldig session' }, 401) }
  }

  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role, approved')
    .eq('id', user.id)
    .single()

  if (!profile?.approved || profile.role !== 'admin') {
    return { error: json({ error: 'Kun administratorer kan redigere brugere' }, 403) }
  }

  return { user, supabaseAdmin: createClient(supabaseUrl, serviceKey) }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
