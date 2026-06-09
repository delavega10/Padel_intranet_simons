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
      return json({ error: 'Kun administratorer kan slette brugere' }, 403)
    }

    const body = await req.json()
    const userId = String(body.id ?? '').trim()
    if (!userId) {
      return json({ error: 'Manglende bruger-id' }, 400)
    }

    if (userId === user.id) {
      return json({ error: 'Du kan ikke slette din egen konto' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('role, approved')
      .eq('id', userId)
      .single()

    if (!target) {
      return json({ error: 'Brugeren findes ikke' }, 404)
    }

    if (target.role === 'admin' && target.approved) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('approved', true)

      if ((count ?? 0) <= 1) {
        return json({ error: 'Kan ikke slette den sidste administrator' }, 400)
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) return json({ error: deleteError.message }, 400)

    return json({ id: userId })
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
