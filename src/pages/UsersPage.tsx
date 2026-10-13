import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export function UsersPage() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader title="Comptes et habilitations" />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <div className="flex items-start gap-3">
          <Shield size={20} className="mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold">Gestion administrée indisponible dans cette interface</h2>
            <p className="mt-2 text-sm">
              Un profil applicatif ne crée pas un compte Supabase Auth. Les invitations et changements
              d’habilitation doivent être réalisés par une procédure administrée qui lie un compte Auth
              réel à un profil. La création, l’activation, la suppression et le changement de rôle
              depuis cet écran sont désactivés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
