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
  'soumise',
  'validée',
  'payée',
  'justifiée',
  'clôturée',
  'rejetée',
  'annulée',
] as const;

export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-700 border-gray-300',
  soumise: 'bg-blue-50 text-blue-700 border-blue-300',
  'en attente': 'bg-blue-50 text-blue-700 border-blue-300',
  validée: 'bg-green-50 text-green-700 border-green-300',
  payée: 'bg-green-50 text-green-700 border-green-300',
  justifiée: 'bg-green-50 text-green-700 border-green-300',
  clôturée: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  rejetée: 'bg-red-50 text-red-700 border-red-300',
  annulée: 'bg-gray-100 text-gray-500 border-gray-300',
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
  prévu: 'bg-gray-100 text-gray-700 border-gray-300',
  envoyé: 'bg-blue-50 text-blue-700 border-blue-300',
  'en transit': 'bg-amber-50 text-amber-700 border-amber-300',
  reçu: 'bg-green-50 text-green-700 border-green-300',
  'partiellement reçu': 'bg-amber-50 text-amber-700 border-amber-300',
  annulé: 'bg-red-50 text-red-700 border-red-300',
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
  planifié: 'bg-gray-100 text-gray-700 border-gray-300',
  'en préparation': 'bg-blue-50 text-blue-700 border-blue-300',
  'en cours': 'bg-green-50 text-green-700 border-green-300',
  'en retard': 'bg-red-50 text-red-700 border-red-300',
  terminé: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  suspendu: 'bg-amber-50 text-amber-700 border-amber-300',
};

export const DOCUMENT_STATUSES = [
  'manquant',
  'ajouté',
  'à vérifier',
  'vérifié',
  'rejeté',
] as const;

export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  manquant: 'bg-red-50 text-red-700 border-red-300',
  ajouté: 'bg-gray-100 text-gray-700 border-gray-300',
  'à vérifier': 'bg-amber-50 text-amber-700 border-amber-300',
  vérifié: 'bg-green-50 text-green-700 border-green-300',
  rejeté: 'bg-red-50 text-red-700 border-red-300',
};

export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-300',
  medium: 'bg-amber-50 text-amber-700 border-amber-300',
  low: 'bg-blue-50 text-blue-700 border-blue-300',
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
  brouillon: 'bg-gray-100 text-gray-700 border-gray-300',
  publiée: 'bg-green-50 text-green-700 border-green-300',
  archivée: 'bg-amber-50 text-amber-700 border-amber-300',
};
