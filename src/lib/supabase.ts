import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function getRequiredEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === '' || value === 'your-anon-key-here') {
    throw new Error(
      `[configuration] ${name} is missing or still uses a placeholder. ` +
      'Configure the environment before starting the application.'
    );
  }

  return value;
}

const validatedSupabaseUrl = getRequiredEnv('VITE_SUPABASE_URL', supabaseUrl);
const validatedSupabaseAnonKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);

try {
  new URL(validatedSupabaseUrl);
} catch {
  throw new Error('[configuration] VITE_SUPABASE_URL must be a valid URL.');
}

export const supabase = createClient(validatedSupabaseUrl, validatedSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
