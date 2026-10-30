/**
 * Constantes de chemins pour le module Élevage.
 * Source unique de vérité — utilisée par Sidebar, Livestock, AnimalManage, Dashboard.
 * Les anciennes URLs /app/livestock/* sont conservées comme redirections (favoris).
 */

export const LIVESTOCK_PATHS = {
  /** Hub principal élevage */
  hub: '/app/livestock',

  /** Lots — destination finale (page de gestion) */
  lots: '/app/exploitation/lots',
  /** Lots — ancienne URL (redirection préservant search/hash) */
  lotsLegacy: '/app/livestock/lots',

  /** Animaux — destination finale (page de gestion) */
  animals: '/app/exploitation/animaux',
  /** Animaux — ancienne URL (redirection préservant search/hash) */
  animalsLegacy: '/app/livestock/animals',

  /** Événements — destination finale (page de gestion) */
  events: '/app/livestock/events',
  /** Événements — aucune legacy nécessaire (déjà sur livestock) */
} as const;

export type LivestockPathKey = keyof typeof LIVESTOCK_PATHS;

/**
 * Génère une URL avec préservation des paramètres de recherche et hash.
 * Utilisé pour les redirections depuis les anciennes URLs.
 */
export function withPreservedParams(
  basePath: string,
  search: string,
  hash: string
): string {
  return basePath + search + hash;
}