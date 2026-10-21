import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission, getAccessibleModules, type ModuleKey, type PermissionAction, type UserRole } from '@/lib/rbac';

// eslint-disable-next-line react-refresh/only-export-components
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { appUser, authUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!(authUser && appUser);

  if (!isAuthenticated) {
    // Rediriger vers la page de login en sauvegardant l'emplacement actuel
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Composant pour protéger les routes nécessitant un module spécifique
// eslint-disable-next-line react-refresh/only-export-components
export function RequireModule({ module, action = 'read', children }: { module: ModuleKey; action?: PermissionAction; children: React.ReactNode }) {
  const { appUser, authUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!(authUser && appUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier la permission sur le module
  const userRole = appUser?.role as UserRole;
  const hasAccess = hasPermission(userRole, module, action);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Accès non autorisé</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à ce module.
            <br />
            Rôle requis : permission <strong>{action}</strong> sur <strong>{module}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// Composant pour protéger les routes nécessitant un rôle spécifique (legacy)
// eslint-disable-next-line react-refresh/only-export-components
export function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { appUser } = useAuth();

  // Vérifier si l'utilisateur a le rôle requis
  const hasRole = appUser?.role === role;

  if (!hasRole) {
    return <div className="p-6">Accès non autorisé</div>;
  }

  return children;
}

// Hook personnalisé pour vérifier l'authentification
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthRequired() {
  const { appUser, authUser } = useAuth();
  const isAuthenticated = !!(authUser && appUser);

  return isAuthenticated;
}

// Hook pour vérifier les permissions sur un module
// eslint-disable-next-line react-refresh/only-export-components
export function useModulePermission(module: ModuleKey, action: PermissionAction = 'read') {
  const { appUser } = useAuth();
  const userRole = appUser?.role as UserRole;
  return hasPermission(userRole, module, action);
}

// Hook pour obtenir les modules accessibles
// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibleModules() {
  const { appUser } = useAuth();
  const userRole = appUser?.role as UserRole;
  return getAccessibleModules(userRole);
}