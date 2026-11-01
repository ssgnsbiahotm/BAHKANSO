// ============================================
// Statuts standardisés Bahkanso - Tout en français
// ============================================

import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER, STATUS_CLASS_NEUTRAL } from '@/lib/constants';

export const SITE_STATUSES = {
  ACTIF: 'actif',
  INACTIF: 'inactif',
} as const;
export type SiteStatus = typeof SITE_STATUSES[keyof typeof SITE_STATUSES];

export const PLOT_STATUSES = {
  ACTIF: 'actif',
  REPOS: 'repos',
  INACTIF: 'inactif',
} as const;
export type PlotStatus = typeof PLOT_STATUSES[keyof typeof PLOT_STATUSES];

export const CAMPAIGN_STATUSES = {
  PLANIFIE: 'planifié',
  EN_COURS: 'en cours',
  TERMINE: 'terminé',
  RECOLTE: 'récolté',
} as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[keyof typeof CAMPAIGN_STATUSES];

export const EXPENSE_STATUSES = {
  BROUILLON: 'brouillon',
  EN_ATTENTE: 'en attente',
  VALIDEE: 'validée',
  PAYEE: 'payée',
  REJETEE: 'rejetée',
  ANNULEE: 'annulée',
} as const;
export type ExpenseStatus = typeof EXPENSE_STATUSES[keyof typeof EXPENSE_STATUSES];

export const SALE_STATUSES = {
  PAYEE: 'payée',
  EN_ATTENTE: 'en attente',
  ANNULEE: 'annulée',
} as const;
export type SaleStatus = typeof SALE_STATUSES[keyof typeof SALE_STATUSES];

export const ANIMAL_STATUSES = {
  ACTIF: 'actif',
  VENDU: 'vendu',
  MORT: 'mort',
  MALADE: 'malade',
} as const;
export type AnimalStatus = typeof ANIMAL_STATUSES[keyof typeof ANIMAL_STATUSES];

export const PROJECT_STATUSES = {
  PLANIFIE: 'planifié',
  EN_COURS: 'en cours',
  TERMINE: 'terminé',
  EN_RETARD: 'en retard',
  SUSPENDU: 'suspendu',
} as const;
export type ProjectStatus = typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES];

// ============================================
// Labels pour affichage
// ============================================
export const STATUS_LABELS: Record<string, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  repos: 'Repos',
  planifié: 'Planifié',
  'en cours': 'En cours',
  terminé: 'Terminé',
  récolté: 'Récolté',
  brouillon: 'Brouillon',
  'en attente': 'En attente',
  validée: 'Validée',
  payée: 'Payée',
  rejetée: 'Rejetée',
  annulée: 'Annulée',
  vendu: 'Vendu',
  mort: 'Mort',
  malade: 'Malade',
  'en retard': 'En retard',
  suspendu: 'Suspendu',
};

// ============================================
// Couleurs de badge par statut (utilise les STATUS_CLASS_* de constants.ts)
// ============================================
export const STATUS_COLORS: Record<string, string> = {
  actif: STATUS_CLASS_SUCCESS,
  inactif: STATUS_CLASS_NEUTRAL,
  repos: STATUS_CLASS_WARNING,
  planifié: STATUS_CLASS_INFO,
  'en cours': STATUS_CLASS_SUCCESS,
  terminé: STATUS_CLASS_SUCCESS,
  récolté: STATUS_CLASS_INFO,
  brouillon: STATUS_CLASS_NEUTRAL,
  'en attente': STATUS_CLASS_WARNING,
  validée: STATUS_CLASS_SUCCESS,
  payée: STATUS_CLASS_SUCCESS,
  rejetée: STATUS_CLASS_DANGER,
  annulée: STATUS_CLASS_NEUTRAL,
  vendu: STATUS_CLASS_INFO,
  mort: STATUS_CLASS_DANGER,
  malade: STATUS_CLASS_WARNING,
  'en retard': STATUS_CLASS_DANGER,
  suspendu: STATUS_CLASS_WARNING,
};

// ============================================
// Helper : obtenir le label d'un statut
// ============================================
export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return STATUS_LABELS[status] || status;
}

// ============================================
// Helper : obtenir la classe CSS d'un statut
// ============================================
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return STATUS_CLASS_NEUTRAL;
  return STATUS_COLORS[status] || STATUS_CLASS_NEUTRAL;
}
