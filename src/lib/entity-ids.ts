import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Génère un identifiant séquentiel PREFIX-NNN pour une table/colonne.
 * Ex : generateEntityIdentifier('PAR', 'plots', 'reference', supabase)
 *      → 'PAR-001', 'PAR-002', etc.
 *
 * Récupère le max existant en DB pour ce préfixe et incrémente.
 * Attention : pas de verrouillage DB, donc une race condition est possible
 * si deux créations simultanées pour le même préfixe obtiennent le même numéro.
 */
export async function generateEntityIdentifier(
  prefix: string,
  tableName: string,
  columnName: string,
  supabaseClient: SupabaseClient,
  padLength = 3,
): Promise<string> {
  const { data, error } = await supabaseClient
    .from(tableName)
    .select(columnName)
    .ilike(columnName, `${prefix}-%`)
    .order(columnName, { ascending: false })
    .limit(1);

  if (error) throw error;

  let next = 1;
  const row = data?.[0] as unknown as Record<string, string> | undefined;
  if (row?.[columnName]) {
    const m = row[columnName].match(/-(\d+)$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${String(next).padStart(padLength, '0')}`;
}
