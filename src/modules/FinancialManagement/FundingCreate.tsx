import { useState } from 'react';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { fundingSchema } from '@/lib/validation/schemas';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import {
  Wallet,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Save,
  Loader2,
  LucideProps
} from 'lucide-react';

interface FundingFormValues {
  amount: number;
  date_sent: Date;
  date_expected?: Date;
  funder_id: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'received';
}

interface FunderOption {
  id: string;
  name: string;
}

/**
 * Page de création de financement utilisant les nouveaux composants
 * de validation et de formulaire
 */
export function FundingCreate() {
  const { appUser } = useAuth();
  const { funders } = useData();
  const [isLoadingFunders, setIsLoadingFunders] = useState(!funders || funders.length === 0);

  // Charger les financeurs si ce n'est pas déjà fait
  // Dans une vraie application, ceci serait fait dans le DataContext
  // ou avec un hook spécialisé

  const defaultValues: FundingFormValues = {
    amount: 0,
    date_sent: new Date(),
    date_expected: undefined,
    funder_id: '',
    description: '',
    status: 'pending',
  };

  const {
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    setFieldValue,
    resetForm,
    handleSubmit: handleFormSubmit,
  } = useValidatedForm<FundingFormValues>({
    schema: fundingSchema,
    defaultValues,
    onSubmit: async (formData) => {
      // Cette fonction est appelée quand le formulaire est soumis et valide
      // Nous déléguons l'action réelle à notre hook useAsyncAction
      await executeAction(
        async () => {
          const { data, error } = await supabase
            .from('fundings')
            .insert({
              amount: formData.amount,
              date_sent: formData.date_sent.toISOString().split('T')[0],
              date_expected: formData.date_expected?.toISOString().split('T')[0] ?? null,
              funder_id: formData.funder_id,
              description: formData.description,
              status: formData.status,
            });

          if (error) throw error;

          return data;
        },
        {
          successMessage: 'Financement créé avec succès',
          errorMessage: 'Erreur lors de la création du financement',
          onSuccess: (data) => {
            console.log('Financement créé:', data);
            resetForm(); // Réinitialiser le formulaire après succès
          }
        }
      );
    },
    onValid: () => {
      // Callback quand le formulaire devient valide
      // console.log('Formulaire valide');
    },
    onInvalid: () => {
      // Callback quand le formulaire devient invalide
      // console.log('Formulaire invalide');
    },
  });

  // Hook pour gérer les opérations asynchrones avec toast
  const { loading: submitLoading, executeAction } = useAsyncAction();

  // Préparer les options de financeur pour le sélecteur
  const funderOptions: FunderOption[] = funders.map(funder => ({
    id: funder.id,
    name: funder.name,
  }));

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Créer un nouveau financement
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant (XOF)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.amount || 0}
              onChange={(e) => setFieldValue('amount', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.amount ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Entrez le montant"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date d'envoi
            </label>
            <input
              type="date"
              value={values.date_sent.toISOString().split('T')[0]}
              onChange={(e) => setFieldValue('date_sent', new Date(e.target.value))}
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.date_sent ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.date_sent && (
              <p className="mt-1 text-xs text-red-500">{errors.date_sent}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date prévue de réception (optionnelle)
            </label>
            <input
              type="date"
              value={values.date_expected?.toISOString().split('T')[0] ?? ''}
              onChange={(e) =>
                e.target.value
                  ? setFieldValue('date_expected', new Date(e.target.value))
                  : setFieldValue('date_expected', undefined)
              }
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.date_expected ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.date_expected && (
              <p className="mt-1 text-xs text-red-500">{errors.date_expected}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Financeur
            </label>
            <select
              value={values.funder_id}
              onChange={(e) => setFieldValue('funder_id', e.target.value)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.funder_id ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Sélectionner un financeur</option>
              {isLoadingFunders ? (
                <SkeletonLoader type="rectangle" count={3} height="1.5rem" width="100%" />
              ) : (
                funderOptions.length > 0 ? (
                  funderOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))
                ) : (
                  <option value="">Aucun financeur disponible</option>
                )
              )}
            </select>
            {errors.funder_id && (
              <p className="mt-1 text-xs text-red-500">{errors.funder_id}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optionnelle)
            </label>
            <textarea
              value={values.description ?? ''}
              onChange={(e) => setFieldValue('description', e.target.value)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.description ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              rows={3}
              placeholder="Entrez une description optionnelle"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={values.status}
              onChange={(e) => setFieldValue('status', e.target.value as any)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-md ${
                errors.status ? 'border-red-500' : ''
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
              <option value="received">Reçu</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-500">{errors.status}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={!isValid || submitLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                !isValid ? 'opacity-50' : ''
              } ${submitLoading ? 'bg-slate-500' : ''}`}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section d'aide ou d'informations */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h3 className="text-lg font-medium text-slate-900 mb-3">
          Informations sur les financements
        </h3>
        <p className="text-sm text-slate-600">
          Utilisez ce formulaire pour enregistrer un nouveau financement reçu par
          votre exploitation. Assurez-vous de vérifier les informations avec
          les documents justificatifs avant de soumettre.
        </p>
      </div>
    </div>
  );
}