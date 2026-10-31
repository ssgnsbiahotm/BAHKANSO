// ============================================
// Statuts standardisés Bahkanso - Tout en français
// ============================================

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
// Couleurs de badge par statut (Tailwind)
// ============================================
export const STATUS_COLORS: Record<string, string> = {
  actif: 'bg-success-soft text-success',
  inactif: 'bg-surface-hover text-secondary',
  repos: 'bg-warning-soft text-warning',
  planifié: 'bg-info-soft text-info',
  'en cours': 'bg-success-soft text-success',
  terminé: 'bg-success-soft text-success',
  récolté: 'bg-info-soft text-info',
  brouillon: 'bg-surface-hover text-secondary',
  'en attente': 'bg-warning-soft text-warning',
  validée: 'bg-success-soft text-success',
  payée: 'bg-success-soft text-success',
  rejetée: 'bg-danger-soft text-danger',
  annulée: 'bg-surface-hover text-secondary',
  vendu: 'bg-info-soft text-info',
  mort: 'bg-danger-soft text-danger',
  malade: 'bg-warning-soft text-warning',
  'en retard': 'bg-danger-soft text-danger',
  suspendu: 'bg-warning-soft text-warning',
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
  if (!status) return 'bg-surface-hover text-secondary';
  return STATUS_COLORS[status] || 'bg-surface-hover text-secondary';
}
