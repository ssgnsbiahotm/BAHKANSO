export const COLORS = {
  night: '#111A18',
  slate: '#1C2925',
  signal: '#B9D86B',
  ivory: '#F4F1E8',
  ink: '#202824',
  terra: '#C87551',
  grass: '#2E7D32',
  harvest: '#F57F17',
  alert: '#C62828',
  sky: '#0277BD',
  inkMut: '#5A6560',
  inkDim: '#8A948E',
  ivoryAlt: '#EBE6DA',
  ivoryDeep: '#DDD5C4',
  slateHover: '#243430',
  slateRaised: '#202824',
  primary: '#B9D86B',
  secondary: '#C87551',
  lightGreen: '#F0F7E0',
  blue: '#0277BD',
  lightBlue: '#DBEAFE',
  orange: '#F57F17',
  red: '#C62828',
  grayLight: '#F4F1E8',
  grayText: '#5A6560',
  dark: '#111A18',
  white: '#FFFFFF',
};

export const STATUS_CLASS_SUCCESS = 'bg-success-soft text-success border-default';
export const STATUS_CLASS_INFO = 'bg-info-soft text-info border-default';
export const STATUS_CLASS_WARNING = 'bg-warning-soft text-warning border-default';
export const STATUS_CLASS_DANGER = 'bg-danger-soft text-danger border-default';
export const STATUS_CLASS_NEUTRAL = 'bg-surface-hover text-secondary border-default';
export const STATUS_CLASS_MUTED = 'bg-surface-hover text-muted border-default';
export const STATUS_CLASS_TERRA = 'bg-terra-soft text-terra-text border-default';
export const STATUS_CLASS_CYAN = 'bg-cyan-soft text-cyan border-default';
export const STATUS_CLASS_ACCENT = 'bg-accent-soft text-accent-primary border-default';

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
  brouillon: STATUS_CLASS_NEUTRAL,
  'en attente': STATUS_CLASS_INFO,
  validée: STATUS_CLASS_SUCCESS,
  payée: STATUS_CLASS_SUCCESS,
  justifiée: STATUS_CLASS_SUCCESS,
  clôturée: STATUS_CLASS_SUCCESS,
  rejetée: STATUS_CLASS_DANGER,
  annulée: STATUS_CLASS_MUTED,
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
  prévu: STATUS_CLASS_NEUTRAL,
  envoyé: STATUS_CLASS_INFO,
  'en transit': STATUS_CLASS_WARNING,
  reçu: STATUS_CLASS_SUCCESS,
  'partiellement reçu': STATUS_CLASS_WARNING,
  annulé: STATUS_CLASS_DANGER,
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
  planifié: STATUS_CLASS_NEUTRAL,
  'en préparation': STATUS_CLASS_INFO,
  'en cours': STATUS_CLASS_SUCCESS,
  'en retard': STATUS_CLASS_DANGER,
  terminé: STATUS_CLASS_SUCCESS,
  suspendu: STATUS_CLASS_WARNING,
};

export const DOCUMENT_STATUSES = [
  'manquant',
  'ajouté',
  'à vérifier',
  'vérifié',
  'rejeté',
] as const;

export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  manquant: STATUS_CLASS_DANGER,
  ajouté: STATUS_CLASS_NEUTRAL,
  'à vérifier': STATUS_CLASS_WARNING,
  vérifié: STATUS_CLASS_SUCCESS,
  rejeté: STATUS_CLASS_DANGER,
};

export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  high: STATUS_CLASS_DANGER,
  medium: STATUS_CLASS_WARNING,
  low: STATUS_CLASS_INFO,
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
  brouillon: STATUS_CLASS_NEUTRAL,
  publiée: STATUS_CLASS_SUCCESS,
  archivée: STATUS_CLASS_WARNING,
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
  actif: STATUS_CLASS_SUCCESS,
  inactif: STATUS_CLASS_MUTED,
};

export const PLOT_STATUSES = ['actif', 'inactif', 'en jachère'] as const;
export const PLOT_STATUS_COLORS: Record<string, string> = {
  actif: STATUS_CLASS_SUCCESS,
  inactif: STATUS_CLASS_MUTED,
  'en jachère': STATUS_CLASS_WARNING,
};

export const CAMPAIGN_STATUSES = ['planifié', 'en cours', 'terminé', 'annulé'] as const;
export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  planifié: STATUS_CLASS_NEUTRAL,
  'en cours': STATUS_CLASS_SUCCESS,
  terminé: STATUS_CLASS_SUCCESS,
  annulé: STATUS_CLASS_DANGER,
};

export const ANIMAL_STATUSES = ['actif', 'vendu', 'décédé', 'transféré'] as const;
export const ANIMAL_STATUS_COLORS: Record<string, string> = {
  actif: STATUS_CLASS_SUCCESS,
  vendu: STATUS_CLASS_INFO,
  décédé: STATUS_CLASS_DANGER,
  transféré: STATUS_CLASS_WARNING,
};

export const ANIMAL_LOT_STATUSES = ['actif', 'clôturé', 'transféré'] as const;
export const ANIMAL_LOT_STATUS_COLORS: Record<string, string> = {
  actif: STATUS_CLASS_SUCCESS,
  clôturé: STATUS_CLASS_SUCCESS,
  transféré: STATUS_CLASS_WARNING,
};

export const SALE_STATUSES = ['payée', 'partielle', 'en attente', 'annulée'] as const;
export const SALE_STATUS_COLORS: Record<string, string> = {
  payée: STATUS_CLASS_SUCCESS,
  partielle: STATUS_CLASS_WARNING,
  'en attente': STATUS_CLASS_INFO,
  annulée: STATUS_CLASS_DANGER,
};

export const CUSTOMER_TYPES = ['particulier', 'professionnel', 'grossiste', 'coopérative'] as const;
