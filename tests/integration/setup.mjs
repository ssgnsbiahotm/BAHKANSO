import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL
  || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY doit être défini. '
    + 'Récupérer via : supabase status'
  );
}

export const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    // Désactive la validation côté client de la clé de service (format sb_secret_...)
    // pour éviter l'erreur "JWT cryptographic operation failed"
  },
});

export const anonClient = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function createTestUser(email, password, role, siteId) {
  // 1. Créer (ou récupérer) l'auth user via admin (service role)
  let { data: authUser, error: authErr } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
  if (authErr) {
    // L'utilisateur existe peut-être déjà (run précédent non nettoyé,
    // ou autre fichier de test qui partage les mêmes emails)
    const userExists =
      authErr.message?.includes('already been registered') ||
      authErr.message?.includes('Database error creating new user');
    if (userExists) {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === email);
      if (!existing) throw authErr;
      authUser = { user: existing };
    } else {
      throw authErr;
    }
  }

  // 2. Insérer (ou mettre à jour) dans app_users
  let { data: appUser, error: appErr } = await adminClient
    .from('app_users')
    .upsert({
      auth_id: authUser.user.id,
      name: email.split('@')[0],
      email,
      role,
      site_id: siteId,
      active: true
    }, { onConflict: 'email' })
    .select()
    .single();
  if (appErr) throw appErr;

  return { authUser: authUser.user, appUser };
}

export async function signInAs(email, password) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;
  return data.session.access_token;
}

export async function authedClient(token) {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}
