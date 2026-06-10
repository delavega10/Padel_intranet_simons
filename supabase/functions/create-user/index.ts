import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Manglende autorisation' }, 401)
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
      return json({ error: 'Ugyldig session' }, 401)
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role, approved')
      .eq('id', user.id)
      .single()

    if (!profile?.approved || profile.role !== 'admin') {
      return json({ error: 'Kun administratorer kan oprette brugere' }, 403)
    }

    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.full_name ?? '').trim()
    const role = String(body.role ?? 'medarbejder')
    const approved = body.approved !== false

    if (!email || !password || password.length < 6) {
      return json({ error: 'E-mail og adgangskode (min. 6 tegn) er påkrævet' }, 400)
    }

    const allowedRoles = ['admin', 'traener', 'medarbejder']
    if (!allowedRoles.includes(role)) {
      return json({ error: 'Ugyldig rolle' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email.split('@')[0] },
    })

    if (createError) {
      return json({ error: createError.message }, 400)
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName || null,
        role,
        approved,
      })
      .eq('id', created.user.id)

    if (profileError) {
      return json({ error: profileError.message }, 400)
    }

    await supabaseAdmin.from('admin_audit_log').insert({
      actor_id: user.id,
      actor_email: user.email ?? '',
      action: 'create_user',
      target_email: email,
      details: { role, approved, full_name: fullName },
    })

    return json({
      id: created.user.id,
      email: created.user.email,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Ukendt fejl' }, 500)
  }
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
