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
  actif: 'bg-green-100 text-green-700',
  inactif: 'bg-gray-100 text-gray-700',
  repos: 'bg-amber-100 text-amber-700',
  planifié: 'bg-blue-100 text-blue-700',
  'en cours': 'bg-emerald-100 text-emerald-700',
  terminé: 'bg-green-100 text-green-700',
  récolté: 'bg-teal-100 text-teal-700',
  brouillon: 'bg-slate-100 text-slate-700',
  'en attente': 'bg-amber-100 text-amber-700',
  validée: 'bg-green-100 text-green-700',
  payée: 'bg-green-100 text-green-700',
  rejetée: 'bg-red-100 text-red-700',
  annulée: 'bg-gray-100 text-gray-700',
  vendu: 'bg-blue-100 text-blue-700',
  mort: 'bg-red-100 text-red-700',
  malade: 'bg-orange-100 text-orange-700',
  'en retard': 'bg-red-100 text-red-700',
  suspendu: 'bg-orange-100 text-orange-700',
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
  if (!status) return 'bg-gray-100 text-gray-700';
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}
