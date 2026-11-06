import type { SupabaseClient } from '@supabase/supabase-js';

const SPECIES_PREFIX: Record<string, string> = {
  cattle: 'BOV',
  sheep: 'OVI',
  goat: 'CAP',
  poultry: 'VOL',
  swine: 'POR',
};

const FALLBACK_PREFIX = 'ANI';

export function getSpeciesPrefix(species: string): string {
  return SPECIES_PREFIX[species] ?? FALLBACK_PREFIX;
}

/**
 * Génère un identifiant séquentiel PREFIX-NNN pour une espèce.
 * Récupère le max existant en DB pour ce préfixe et incrémente.
 * Ex : si BOV-005 existe → BOV-006
 *
 * Attention : pas de contrainte d'unicité DB sur identifier, donc une
 * race condition est possible si deux créations simultanées pour la même
 * espèce obtiennent le même numéro. À considérer pour un verrouillage DB
 * si le volume le justifie.
 */
export async function generateAnimalIdentifier(
  species: string,
  supabaseClient: SupabaseClient,
): Promise<string> {
  const prefix = getSpeciesPrefix(species);
  const { data, error } = await supabaseClient
    .from('animals')
    .select('identifier')
    .ilike('identifier', `${prefix}-%`)
    .order('identifier', { ascending: false })
    .limit(1);

  if (error) throw error;

  let next = 1;
  if (data?.[0]?.identifier) {
    const m = data[0].identifier.match(/-(\d+)$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
