import { useState, useCallback } from 'react';
import { useToast } from '@/lib/Toast';

/**
 * Hook personnalisé pour gérer les opérations asynchrones avec affichage de toast
 * Standardise le pattern try/await/toast utilisé dans plusieurs composants
 */
export function useAsyncAction<T = any>() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const executeAction = useCallback(
    async <TResult = T>(
      actionFn: () => Promise<TResult>,
      options: {
        successMessage?: string;
        errorMessage?: string;
        onSuccess?: (result: TResult) => void;
        onError?: (error: unknown) => void;
      } = {}
    ): Promise<TResult | undefined> => {
      const {
        successMessage = 'Opération réussie',
        errorMessage = 'Une erreur est survenue',
        onSuccess,
        onError
      } = options;

      setLoading(true);
      try {
        const result = await actionFn();
        toast.show(successMessage, 'success');
        if (onSuccess) onSuccess(result);
        return result;
      } catch (error) {
        const errorMessageToShow =
          error instanceof Error ? error.message : errorMessage;
        toast.show(`Erreur: ${errorMessageToShow}`, 'error');
        if (onError) onError(error);
        throw error; // Re-throw pour permettre au composant de gérer l'erreur si nécessaire
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    loading,
    executeAction
  };
}