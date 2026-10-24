/**
 * Système RBAC (Role-Based Access Control) pour BAHKANSO
 * Hiérarchie des rôles et permissions par module
 */

export type UserRole =
  | 'administrateur'
  | 'propriétaire'
  | 'financeur'
  | 'gestionnaire'
  | 'comptable'
  | 'responsable_agricole'
  | 'responsable_élevage'
  | 'auditeur';

export type ModuleKey =
  | 'dashboard'
  | 'finance'
  | 'ventes'
  | 'agriculture'
  | 'livestock'
  | 'projects'
  | 'inventory'
  | 'suppliers'
  | 'media'
  | 'monitoring'
  | 'surveillance'
  | 'users'
  | 'configuration'
  | 'bailleurs'
  | 'clients'
  | 'profile';

export type PermissionAction = 'read' | 'write' | 'delete' | 'admin';

export interface ModulePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

export interface RolePermissions {
  [module: string]: ModulePermission;
}

// Hiérarchie des rôles (du plus fort au plus faible)
export const ROLE_HIERARCHY: UserRole[] = [
  'administrateur',
  'propriétaire',
  'financeur',
  'gestionnaire',
  'comptable',
  'responsable_agricole',
  'responsable_élevage',
  'auditeur',
];

// Labels affichables pour les rôles
export const ROLE_LABELS: Record<UserRole, string> = {
  administrateur: 'Administrateur',
  propriétaire: 'Propriétaire',
  financeur: 'Financeur',
  gestionnaire: 'Gestionnaire',
  comptable: 'Comptable',
  responsable_agricole: 'Responsable Agricole',
  responsable_élevage: 'Responsable Élevage',
  auditeur: 'Auditeur',
};

// Descriptions des rôles
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrateur: 'Accès total à tous les modules, gestion des utilisateurs et configuration',
  propriétaire: 'Vue d\'ensemble stratégique, finances globales, validation budgétaire',
  financeur: 'Suivi des financements envoyus/reçus, reporting financier',
  gestionnaire: 'Gestion opérationnelle quotidienne, toutes les activités terrain',
  comptable: 'Gestion comptable complète, trésorerie, dépenses, documents',
  responsable_agricole: 'Gestion parcelles, campagnes, opérations culturales, récoltes',
  responsable_élevage: 'Gestion cheptel, lots, animaux, événements sanitaires',
  auditeur: 'Accès lecture seule à tous les modules pour audit et contrôle',
};

// Permissions par rôle et par module
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  administrateur: {
    dashboard: { read: true, write: true, delete: true, admin: true },
    finance: { read: true, write: true, delete: true, admin: true },
    ventes: { read: true, write: true, delete: true, admin: true },
    agriculture: { read: true, write: true, delete: true, admin: true },
    livestock: { read: true, write: true, delete: true, admin: true },
    projects: { read: true, write: true, delete: true, admin: true },
    inventory: { read: true, write: true, delete: true, admin: true },
    suppliers: { read: true, write: true, delete: true, admin: true },
    media: { read: true, write: true, delete: true, admin: true },
    monitoring: { read: true, write: true, delete: true, admin: true },
    surveillance: { read: true, write: true, delete: true, admin: true },
    users: { read: true, write: true, delete: true, admin: true },
    configuration: { read: true, write: true, delete: true, admin: true },
    bailleurs: { read: true, write: true, delete: true, admin: true },
    clients: { read: true, write: true, delete: true, admin: true },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  propriétaire: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: false, admin: false }, // Validation budgétaire
    ventes: { read: true, write: true, delete: false, admin: false }, // Validation commerciale
    agriculture: { read: true, write: false, delete: false, admin: false },
    livestock: { read: true, write: false, delete: false, admin: false },
    projects: { read: true, write: true, delete: false, admin: false }, // Suivi chantiers
    inventory: { read: true, write: false, delete: false, admin: false },
    suppliers: { read: true, write: false, delete: false, admin: false },
    media: { read: true, write: false, delete: false, admin: false },
    monitoring: { read: true, write: false, delete: false, admin: false },
    surveillance: { read: true, write: false, delete: false, admin: false },
    users: { read: true, write: false, delete: false, admin: false },
    configuration: { read: true, write: true, delete: false, admin: false }, // Paramètres ferme
    profile: { read: true, write: true, delete: false, admin: false },
  },

  financeur: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: false, admin: false }, // Ses financements uniquement
    ventes: { read: true, write: false, delete: false, admin: false }, // Vue uniquement
    agriculture: { read: false, write: false, delete: false, admin: false },
    livestock: { read: false, write: false, delete: false, admin: false },
    projects: { read: true, write: false, delete: false, admin: false }, // Projets financés
    inventory: { read: false, write: false, delete: false, admin: false },
    suppliers: { read: false, write: false, delete: false, admin: false },
    media: { read: true, write: false, delete: false, admin: false },
    monitoring: { read: true, write: false, delete: false, admin: false },
    surveillance: { read: false, write: false, delete: false, admin: false },
    users: { read: false, write: false, delete: false, admin: false },
    configuration: { read: false, write: false, delete: false, admin: false },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  gestionnaire: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: false, admin: false }, // Dépenses courantes
    ventes: { read: true, write: true, delete: false, admin: false }, // Ventes courantes
    agriculture: { read: true, write: true, delete: false, admin: false },
    livestock: { read: true, write: true, delete: false, admin: false },
    projects: { read: true, write: true, delete: false, admin: false },
    inventory: { read: true, write: true, delete: false, admin: false },
    suppliers: { read: true, write: true, delete: false, admin: false },
    media: { read: true, write: true, delete: false, admin: false },
    monitoring: { read: true, write: false, delete: false, admin: false },
    surveillance: { read: true, write: true, delete: false, admin: false },
    users: { read: true, write: false, delete: false, admin: false },
    configuration: { read: true, write: false, delete: false, admin: false },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  comptable: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: true, admin: false }, // Complet: dépenses, trésorerie, docs
    ventes: { read: true, write: true, delete: true, admin: false }, // Complet: ventes, clients, facturation
    agriculture: { read: true, write: false, delete: false, admin: false }, // Coûts seulement
    livestock: { read: true, write: false, delete: false, admin: false }, // Coûts seulement
    projects: { read: true, write: false, delete: false, admin: false }, // Budgets seulement
    inventory: { read: true, write: false, delete: false, admin: false }, // Valorisation stock
    suppliers: { read: true, write: true, delete: false, admin: false }, // Factures fournisseurs
    media: { read: true, write: false, delete: false, admin: false },
    monitoring: { read: true, write: false, delete: false, admin: false },
    surveillance: { read: true, write: false, delete: false, admin: false },
    users: { read: false, write: false, delete: false, admin: false },
    configuration: { read: true, write: false, delete: false, admin: false },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  responsable_agricole: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: false, admin: false }, // Dépenses agricoles
    ventes: { read: true, write: false, delete: false, admin: false }, // Vue ventes agricoles
    agriculture: { read: true, write: true, delete: true, admin: false }, // Complet: parcelles, campagnes, opérations, récoltes
    livestock: { read: true, write: false, delete: false, admin: false }, // Vue seulement
    projects: { read: true, write: true, delete: false, admin: false }, // Projets agricoles
    inventory: { read: true, write: true, delete: false, admin: false }, // Stocks intrants
    suppliers: { read: true, write: true, delete: false, admin: false }, // Fournisseurs agricoles
    media: { read: true, write: true, delete: false, admin: false },
    monitoring: { read: true, write: true, delete: false, admin: false },
    surveillance: { read: true, write: true, delete: false, admin: false }, // Phytosanitaires
    users: { read: false, write: false, delete: false, admin: false },
    configuration: { read: false, write: false, delete: false, admin: false },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  responsable_élevage: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: true, delete: false, admin: false }, // Dépenses élevage
    ventes: { read: true, write: false, delete: false, admin: false }, // Vue ventes élevage
    agriculture: { read: true, write: false, delete: false, admin: false }, // Vue seulement
    livestock: { read: true, write: true, delete: true, admin: false }, // Complet: lots, animaux, événements
    projects: { read: true, write: true, delete: false, admin: false }, // Projets élevage
    inventory: { read: true, write: true, delete: false, admin: false }, // Stocks aliments, soins
    suppliers: { read: true, write: true, delete: false, admin: false }, // Fournisseurs élevage
    media: { read: true, write: true, delete: false, admin: false },
    monitoring: { read: true, write: true, delete: false, admin: false },
    surveillance: { read: true, write: true, delete: false, admin: false }, // Sanitaires
    users: { read: false, write: false, delete: false, admin: false },
    configuration: { read: false, write: false, delete: false, admin: false },
    profile: { read: true, write: true, delete: false, admin: false },
  },

  auditeur: {
    dashboard: { read: true, write: false, delete: false, admin: false },
    finance: { read: true, write: false, delete: false, admin: false },
    ventes: { read: true, write: false, delete: false, admin: false },
    agriculture: { read: true, write: false, delete: false, admin: false },
    livestock: { read: true, write: false, delete: false, admin: false },
    projects: { read: true, write: false, delete: false, admin: false },
    inventory: { read: true, write: false, delete: false, admin: false },
    suppliers: { read: true, write: false, delete: false, admin: false },
    media: { read: true, write: false, delete: false, admin: false },
    monitoring: { read: true, write: false, delete: false, admin: false },
    surveillance: { read: true, write: false, delete: false, admin: false },
    users: { read: true, write: false, delete: false, admin: false },
    configuration: { read: true, write: false, delete: false, admin: false },
    profile: { read: true, write: false, delete: false, admin: false },
  },
};

// Vérifier si un rôle a une permission sur un module
export function hasPermission(
  role: UserRole | undefined,
  module: ModuleKey,
  action: PermissionAction = 'read'
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role]?.[module];
  return permissions?.[action] ?? false;
}

// Vérifier l'accès à un module (lecture minimum)
export function canAccessModule(role: UserRole | undefined, module: ModuleKey): boolean {
  return hasPermission(role, module, 'read');
}

// Obtenir les modules accessibles pour un rôle
export function getAccessibleModules(role: UserRole | undefined): ModuleKey[] {
  if (!role) return [];
  return Object.keys(ROLE_PERMISSIONS[role]).filter(
    (module) => ROLE_PERMISSIONS[role][module].read
  ) as ModuleKey[];
}

// Vérifier si un rôle peut écrire dans un module
export function canWriteModule(role: UserRole | undefined, module: ModuleKey): boolean {
  return hasPermission(role, module, 'write');
}

// Vérifier si un rôle peut supprimer dans un module
export function canDeleteModule(role: UserRole | undefined, module: ModuleKey): boolean {
  return hasPermission(role, module, 'delete');
}

// Vérifier si un rôle a les droits admin sur un module
export function isModuleAdmin(role: UserRole | undefined, module: ModuleKey): boolean {
  return hasPermission(role, module, 'admin');
}

// Rôles qui peuvent accéder au module finance (transversal)
export const FINANCE_ACCESS_ROLES: UserRole[] = [
  'administrateur',
  'propriétaire',
  'financeur',
  'gestionnaire',
  'comptable',
  'responsable_agricole',
  'responsable_élevage',
  'auditeur',
];

// Vérifier l'accès finance (tous les rôles authentifiés sauf restriction future)
export function canAccessFinance(role: UserRole | undefined): boolean {
  return FINANCE_ACCESS_ROLES.includes(role as UserRole);
}

// Obtenir le niveau de permission finance selon le rôle
export function getFinancePermissionLevel(role: UserRole | undefined): 'full' | 'write' | 'read' | 'none' {
  if (!role) return 'none';
  const perm = ROLE_PERMISSIONS[role]?.finance;
  if (!perm) return 'none';
  if (perm.admin) return 'full';
  if (perm.write) return 'write';
  if (perm.read) return 'read';
  return 'none';
}