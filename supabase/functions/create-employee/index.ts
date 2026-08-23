// Edge Function: crea un usuario de auth + su fila en `employees`.
//
// `supabase.auth.admin.createUser` necesita la service_role key, que nunca
// puede vivir en el navegador (salta toda RLS). Esta función corre en el
// servidor de Supabase: recibe el pedido con el JWT del admin que lo hace,
// confirma que sea un empleado con rol "admin", y recién ahí usa la
// service_role key (guardada como secret de la función, no del cliente).
//
// Deploy: supabase functions deploy create-employee
// Secrets (ya vienen seteados por Supabase en runtime, no hace falta cargarlos a mano):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''

    // Cliente "de usuario": valida quién está llamando con su propio JWT
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return json({ error: 'No autenticado' }, 401)
    }

    const { data: callerEmployee } = await callerClient
      .from('employees')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (callerEmployee?.role !== 'admin') {
      return json({ error: 'Solo un admin puede crear miembros del equipo' }, 403)
    }

    const { name, email, password, role, active } = await req.json()
    if (!name || !email || !password) {
      return json({ error: 'Nombre, email y contraseña son obligatorios' }, 400)
    }
    if (password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
    }

    // Cliente admin: recién acá se usa la service_role key, del lado del servidor
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) {
      return json({ error: createError.message }, 400)
    }

    const { error: insertError } = await adminClient.from('employees').insert({
      user_id: created.user.id,
      name,
      email,
      role: role || 'vendedor',
      active: active ?? true,
    })
    if (insertError) {
      // Si falla la fila de employees, no dejamos un usuario de auth huérfano
      await adminClient.auth.admin.deleteUser(created.user.id)
      return json({ error: insertError.message }, 400)
    }

    return json({ ok: true })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error inesperado' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
