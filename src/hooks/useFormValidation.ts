import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

interface FormValidationState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Hook personnalisé pour la validation des formulaires avec Zod
 * Gère l'état du formulaire, la validation et les erreurs
 */
export function useFormValidation<T extends object>(
  schema: ZodSchema<T>,
  defaultValues: T = {} as T
) {
  const [state, setState] = useState<FormValidationState<T>>({
    values: defaultValues,
    errors: {},
    isValid: false,
    isDirty: false,
  });

  // Mettre à jour une valeur spécifique du formulaire
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setState(prev => {
        const newValues = { ...prev.values, [field]: value };
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(defaultValues);

        // Valider seulement le champ modifié si on veut une validation en temps réel
        // Pour simplifier, on valide tout le formulaire à chaque changement
        const errors: Partial<Record<keyof T, string>> = {};

        try {
          schema.parse({ ...prev.values, [field]: value });
        } catch (err) {
          if (err instanceof ZodError) {
            err.issues.forEach(error => {
              const fieldName = error.path[0] as keyof T;
              errors[fieldName] = error.message;
            });
          }
        }

        return {
          values: newValues,
          errors,
          isValid: Object.keys(errors).length === 0,
          isDirty,
        };
      });
    },
    [schema, defaultValues]
  );

  // Réinitialiser le formulaire aux valeurs par défaut
  const resetForm = useCallback(() => {
    setState({
      values: defaultValues,
      errors: {},
      isValid: false,
      isDirty: false,
    });
  }, [defaultValues]);

  // Valider l'ensemble du formulaire
  const validateForm = useCallback(() => {
    try {
      schema.parse(state.values);
      setState(prev => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        err.issues.forEach(error => {
          const fieldName = error.path[0] as keyof T;
          errors[fieldName] = error.message;
        });
        setState(prev => ({
          ...prev,
          errors,
          isValid: false,
        }));
      }
      return false;
    }
  }, [schema, state.values]);

  // Mettre à jour plusieurs champs à la fois
  const setFieldValues = useCallback(
    (newValues: Partial<T>) => {
      setState(prev => {
        const updatedValues = { ...prev.values, ...newValues };
        const isDirty = JSON.stringify(updatedValues) !== JSON.stringify(defaultValues);

        const errors: Partial<Record<keyof T, string>> = {};

        try {
          schema.parse(updatedValues);
        } catch (err) {
          if (err instanceof ZodError) {
            err.issues.forEach(error => {
              const fieldName = error.path[0] as keyof T;
              errors[fieldName] = error.message;
            });
          }
        }

        return {
          values: updatedValues,
          errors,
          isValid: Object.keys(errors).length === 0,
          isDirty,
        };
      });
    },
    [schema, defaultValues]
  );

  // Définir manuellement les erreurs (utile pour les erreurs serveur)
  const setFieldErrors = useCallback(
    (newErrors: Partial<Record<keyof T, string>>) => {
      setState(prev => ({
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      }));
    },
    []
  );

  return {
    // État du formulaire
    ...state,

    // Méthodes de mise à jour
    setFieldValue,
    setFieldValues,
    resetForm,

    // Méthodes de validation
    validateForm,
    setFieldErrors,

    // Helper pour vérifier si un champ a une erreur
    hasFieldError: useCallback(
      (field: keyof T): boolean => !!state.errors[field],
      [state.errors]
    ),

    // Helper pour obtenir l'erreur d'un champ
    getFieldError: useCallback(
      (field: keyof T): string | undefined => state.errors[field],
      [state.errors]
    ),
  };
}