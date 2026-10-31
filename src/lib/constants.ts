export const COLORS = {
  primary: '#166534',
  secondary: '#22C55E',
  lightGreen: '#DCFCE7',
  blue: '#2563EB',
  lightBlue: '#DBEAFE',
  orange: '#F59E0B',
  red: '#DC2626',
  grayLight: '#F8FAFC',
  grayText: '#334155',
  dark: '#0F172A',
  white: '#FFFFFF',
};

export const EXPENSE_STATUSES = [
  'brouillon',
  'en attente',
  'validée',
  'payée',
  'justifiée',
  'clôturée',
  'rejetée',
  'annulée',
] as const;

export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  brouillon: 'bg-surface-hover text-secondary border-gray-300',
  soumise: 'bg-info-soft text-info border-default',
  'en attente': 'bg-info-soft text-info border-default',
  validée: 'bg-success-soft text-success border-default',
  payée: 'bg-success-soft text-success border-default',
  justifiée: 'bg-success-soft text-success border-default',
  clôturée: 'bg-success-soft text-success border-default',
  rejetée: 'bg-danger-soft text-danger border-default',
  annulée: 'bg-surface-hover text-muted border-default',
};

export const FUNDING_STATUSES = [
  'prévu',
  'envoyé',
  'en transit',
  'reçu',
  'partiellement reçu',
  'annulé',
] as const;

export const FUNDING_STATUS_COLORS: Record<string, string> = {
  prévu: 'bg-surface-hover text-secondary border-gray-300',
  envoyé: 'bg-info-soft text-info border-default',
  'en transit': 'bg-warning-soft text-warning border-default',
  reçu: 'bg-success-soft text-success border-default',
  'partiellement reçu': 'bg-warning-soft text-warning border-default',
  annulé: 'bg-danger-soft text-danger border-default',
};

export const PROJECT_STATUSES = [
  'planifié',
  'en préparation',
  'en cours',
  'en retard',
  'terminé',
  'suspendu',
] as const;

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planifié: 'bg-surface-hover text-secondary border-gray-300',
  'en préparation': 'bg-info-soft text-info border-default',
  'en cours': 'bg-success-soft text-success border-default',
  'en retard': 'bg-danger-soft text-danger border-default',
  terminé: 'bg-success-soft text-success border-default',
  suspendu: 'bg-warning-soft text-warning border-default',
};

export const DOCUMENT_STATUSES = [
  'manquant',
  'ajouté',
  'à vérifier',
  'vérifié',
  'rejeté',
] as const;

export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  manquant: 'bg-danger-soft text-danger border-default',
  ajouté: 'bg-surface-hover text-secondary border-gray-300',
  'à vérifier': 'bg-warning-soft text-warning border-default',
  vérifié: 'bg-success-soft text-success border-default',
  rejeté: 'bg-danger-soft text-danger border-default',
};

export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-danger-soft text-danger border-default',
  medium: 'bg-warning-soft text-warning border-default',
  low: 'bg-info-soft text-info border-default',
};

export const ROLES = [
  { value: 'administrateur', label: 'Administrateur' },
  { value: 'propriétaire', label: 'Propriétaire / Direction' },
  { value: 'financeur', label: 'Financeur' },
  { value: 'gestionnaire', label: 'Gestionnaire' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'responsable_agricole', label: 'Responsable agricole' },
  { value: 'responsable_élevage', label: 'Responsable élevage' },
  { value: 'responsable_chantier', label: 'Responsable chantier' },
  { value: 'auditeur', label: 'Auditeur' },
];

export const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  propriétaire: 'Propriétaire / Direction',
  financeur: 'Financeur',
  gestionnaire: 'Gestionnaire',
  comptable: 'Comptable',
  responsable_agricole: 'Responsable agricole',
  'responsable_élevage': 'Responsable élevage',
  responsable_chantier: 'Responsable chantier',
  auditeur: 'Auditeur',
};

export const EXPENSE_CATEGORIES = [
  'Alimentation animale',
  'Semences',
  'Engrais',
  'Produits vétérinaires',
  'Main-d\'œuvre',
  'Matériaux',
  'Carburant',
  'Transport',
  'Équipement',
  'Maintenance',
  'Construction',
  'Administration',
  'Autre',
];

export const PAYMENT_METHODS = ['espèces', 'virement', 'chèque', 'mobile money', 'carte'];

export const DOCUMENT_TYPES = [
  'facture',
  'reçu',
  'bon de livraison',
  'contrat',
  'preuve de paiement',
  'photographie',
  'PDF',
  'autre document',
];

export const CROP_OPERATION_TYPES = [
  'préparation',
  'labour',
  'semis',
  'fertilisation',
  'traitement',
  'irrigation',
  'entretien',
  'récolte',
  'plantation',
];

export const ANIMAL_EVENT_TYPES = [
  'naissance',
  'achat',
  'vente',
  'vaccination',
  'traitement',
  'pesée',
  'transfert',
  'reproduction',
  'mortalité',
];

export const INVENTORY_MOVEMENT_TYPES = [
  'achat',
  'entrée',
  'consommation',
  'transfert',
  'perte',
  'vente',
  'ajustement',
];

export const PROJECT_TYPES = [
  'Forage',
  'Hangar',
  'Bâtiment',
  'Clôture',
  'Irrigation',
  'Équipement',
  'Autre',
];

export const RECIPE_CATEGORIES = [
  'Plat principal',
  'Accompagnement',
  'Dessert',
  'Entrée',
  'Boisson',
  'Snack',
  'Autre',
];

export const RECIPE_DIFFICULTIES = [
  'facile',
  'moyen',
  'difficile',
];

export const RECIPE_STATUSES = [
  'brouillon',
  'publiée',
  'archivée',
];

export const RECIPE_STATUS_COLORS: Record<string, string> = {
  brouillon: 'bg-surface-hover text-secondary border-gray-300',
  publiée: 'bg-success-soft text-success border-default',
  archivée: 'bg-warning-soft text-warning border-default',
};

export const MEDIA_TYPES = [
  'image',
  'icon',
  'logo',
] as const;

export const MEDIA_CATEGORIES = [
  'site vitrine',
  'icône application',
  'logo',
  'illustration',
  'bannière',
  'autre',
] as const;

// ============================================
// STATUTS HARMONISÉS (source unique de vérité)
// ============================================

export const SITE_STATUSES = ['actif', 'inactif'] as const;
export const SITE_STATUS_COLORS: Record<string, string> = {
  actif: 'bg-success-soft text-success border-default',
  inactif: 'bg-surface-hover text-muted border-default',
};

export const PLOT_STATUSES = ['actif', 'inactif', 'en jachère'] as const;
export const PLOT_STATUS_COLORS: Record<string, string> = {
  actif: 'bg-success-soft text-success border-default',
  inactif: 'bg-surface-hover text-muted border-default',
  'en jachère': 'bg-warning-soft text-warning border-default',
};

export const CAMPAIGN_STATUSES = ['planifié', 'en cours', 'terminé', 'annulé'] as const;
export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  planifié: 'bg-surface-hover text-secondary border-gray-300',
  'en cours': 'bg-success-soft text-success border-default',
  terminé: 'bg-success-soft text-success border-default',
  annulé: 'bg-danger-soft text-danger border-default',
};

export const ANIMAL_STATUSES = ['actif', 'vendu', 'décédé', 'transféré'] as const;
export const ANIMAL_STATUS_COLORS: Record<string, string> = {
  actif: 'bg-success-soft text-success border-default',
  vendu: 'bg-info-soft text-info border-default',
  décédé: 'bg-danger-soft text-danger border-default',
  transféré: 'bg-warning-soft text-warning border-default',
};

export const ANIMAL_LOT_STATUSES = ['actif', 'clôturé', 'transféré'] as const;
export const ANIMAL_LOT_STATUS_COLORS: Record<string, string> = {
  actif: 'bg-success-soft text-success border-default',
  clôturé: 'bg-success-soft text-success border-default',
  transféré: 'bg-warning-soft text-warning border-default',
};

export const SALE_STATUSES = ['payée', 'partielle', 'en attente', 'annulée'] as const;
export const SALE_STATUS_COLORS: Record<string, string> = {
  payée: 'bg-success-soft text-success border-default',
  partielle: 'bg-warning-soft text-warning border-default',
  'en attente': 'bg-info-soft text-info border-default',
  annulée: 'bg-danger-soft text-danger border-default',
};

export const CUSTOMER_TYPES = ['particulier', 'professionnel', 'grossiste', 'coopérative'] as const;
