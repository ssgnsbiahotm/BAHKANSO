export const MODULES = [
  'dashboard',
  'fundings',
  'treasury',
  'expenses',
  'documents',
  'agriculture',
  'livestock',
  'projects',
  'inventory',
  'suppliers',
  'revenues',
  'reports',
  'alerts',
  'audit',
  'users',
  'settings',
  'profile',
] as const;

export type AppModule = typeof MODULES[number];
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'validate';
type ModulePermissions = Partial<Record<AppModule, readonly PermissionAction[]>>;

const READ_ALL: readonly AppModule[] = MODULES.filter(module => module !== 'profile');
const CRUD: readonly PermissionAction[] = ['read', 'create', 'update', 'delete'];
const READ_ONLY: readonly PermissionAction[] = ['read'];
const CRUD_WITHOUT_VALIDATION: readonly PermissionAction[] = CRUD;
const CRUD_WITH_VALIDATION: readonly PermissionAction[] = [...CRUD, 'validate'];
const PROFILE_PERMISSIONS: ModulePermissions = {
  profile: ['read', 'update'],
};

function permissionsFor(
  modules: readonly AppModule[],
  actions: readonly PermissionAction[],
): ModulePermissions {
  return Object.fromEntries(modules.map(module => [module, actions])) as ModulePermissions;
}

export const ROLE_PERMISSIONS: Readonly<Record<string, ModulePermissions>> = {
  propriétaire: {
    ...permissionsFor(READ_ALL, READ_ONLY),
    profile: ['read', 'update'],
  },
  administrateur: {
    ...permissionsFor(READ_ALL, CRUD),
    fundings: CRUD_WITH_VALIDATION,
    expenses: CRUD_WITH_VALIDATION,
    documents: CRUD_WITH_VALIDATION,
    audit: READ_ONLY,
    users: ['read', 'update'],
    profile: ['read', 'update'],
  },
  gestionnaire: {
    ...permissionsFor(
      ['dashboard', 'fundings', 'treasury', 'expenses', 'documents', 'agriculture', 'livestock',
        'projects', 'inventory', 'suppliers', 'revenues', 'reports', 'alerts'],
      CRUD_WITHOUT_VALIDATION,
    ),
    treasury: READ_ONLY,
    documents: ['read', 'create', 'update', 'delete'],
    profile: ['read', 'update'],
  },
  responsable_agricole: {
    agriculture: CRUD,
    profile: ['read', 'update'],
  },
  'responsable_élevage': {
    livestock: CRUD,
    profile: ['read', 'update'],
  },
  responsable_chantier: {
    projects: CRUD,
    profile: ['read', 'update'],
  },
  financeur: {
    fundings: READ_ONLY,
    profile: ['read', 'update'],
  },
  comptable: PROFILE_PERMISSIONS,
  auditeur: PROFILE_PERMISSIONS,
};

export function hasPermission(
  role: string | null | undefined,
  module: AppModule,
  action: PermissionAction,
): boolean {
  return ROLE_PERMISSIONS[role ?? '']?.[module]?.includes(action) ?? false;
}

export function canReadFundings(role: string | null | undefined, funderId?: string | null): boolean {
  if (!hasPermission(role, 'fundings', 'read')) return false;
  return role !== 'financeur' || Boolean(funderId);
}

export function defaultModuleForRole(role: string | null | undefined): AppModule | null {
  if (hasPermission(role, 'dashboard', 'read')) return 'dashboard';
  return MODULES.find(module => module !== 'profile' && hasPermission(role, module, 'read')) ?? null;
}

export function canAccessModule(
  role: string | null | undefined,
  module: AppModule,
): boolean {
  return hasPermission(role, module, 'read');
}
