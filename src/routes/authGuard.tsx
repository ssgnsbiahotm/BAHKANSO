import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Composant pour protéger les routes nécessitant une authentification
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { appUser, authUser } = useAuth();
  const location = useLocation();

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!(authUser && appUser);

  if (!isAuthenticated) {
    // Rediriger vers la page de login en sauvegardant l'emplacement actuel
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Composant pour protéger les routes nécessitant une authentification avec un rôle spécifique
export function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { appUser } = useAuth();

  // Vérifier si l'utilisateur a le rôle requis
  const hasRole = appUser?.role === role;

  if (!hasRole) {
    // Rediriger vers l'accueil ou afficher un message d'erreur
    return <div className="p-6">Accès non autorisé</div>;
  }

  return children;
}

// Hook personnalisé pour vérifier l'authentification
export function useAuthRequired() {
  const { appUser, authUser } = useAuth();
  const isAuthenticated = !!(authUser && appUser);

  return isAuthenticated;
}