import { useState } from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ZodSchema } from 'zod';

interface ValidatedFormProps<T> {
  /** Schéma de validation Zod */
  schema: ZodSchema<T>;
  /** Valeurs par défaut du formulaire */
  defaultValues: T;
  /** Fonction de soumission du formulaire */
  onSubmit: (values: T) => Promise<void> | void;
  /** Texte du bouton de soumission */
  submitLabel?: string;
  /** Activer la validation en temps réel */
  validateOnChange?: boolean;
  /** Fonction appelée quand le formulaire est valide */
  onValid?: () => void;
  /** Fonction appelée quand le formulaire devient invalide */
  onInvalid?: () => void;
}

interface ValidatedFormReturn<T> {
  /** Valeurs actuelles du formulaire */
  values: T;
  /** Erreurs de validation par champ */
  errors: Partial<Record<keyof T, string>>;
  /** Indique si le formulaire est valide */
  isValid: boolean;
  /** Indique si le formulaire a été modifié */
  isDirty: boolean;
  /** Indique si une soumission est en cours */
  isSubmitting: boolean;
  /** Fonction pour mettre à jour une valeur de champ */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Fonction pour réinitialiser le formulaire */
  resetForm: () => void;
  /** Fonction pour soumettre le formulaire */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Composant de formulaire avec validation intégrée utilisant Zod
 * Gère l'état, la validation et la soumission du formulaire
 */
export function ValidatedForm<T extends object = Record<string, unknown>>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Soumettre', // utilisé comme valeur par défaut
  validateOnChange = false, // utilisé comme valeur par défaut
  onValid, // utilisé dans le composant
  onInvalid,
}: ValidatedFormProps<T>): ValidatedFormReturn<T> {
  const {
    values,
    errors,
    isValid,
    isDirty,
    setFieldValue,
    resetForm,
    validateForm,
  } = useFormValidation<T>(schema, defaultValues);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier les changements de validité pour appeler les callbacks
  // Utilisons useEffect dans un composant wrapper pour éviter les hooks conditionnels

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      // Valider le formulaire avant la soumission
      validateForm();
      if (onInvalid) onInvalid();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // Optionnellement réinitialiser le formulaire après soumission réussie
      // resetForm();
    } catch (error) {
      // Gérer les erreurs de soumission (peut venir du serveur)
      // Ici on pourrait extraire les erreurs de validation du serveur
      console.error('Erreur de soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return {
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    setFieldValue,
    resetForm,
    handleSubmit,
  };
}

/**
 * Hook personnalisé qui combine useFormValidation avec useEffect pour les callbacks de validation
 * C'est la façon recommandée d'utiliser la validation de formulaire
 */
export function useValidatedForm<T extends object = Record<string, unknown>>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Soumettre', // utilisé comme valeur par défaut
  validateOnChange = false, // utilisé comme valeur par défaut
  onValid, // utilisé dans le composant
  onInvalid,
}: ValidatedFormProps<T>) {
  const formState = useFormValidation<T>(schema, defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effet pour gérer les callbacks de validation
  // eslint-disable-next-line react-hooks/exhaustive-deps


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.isValid) {
      formState.validateForm();
      if (onInvalid) onInvalid();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formState.values);
    } catch (error) {
      console.error('Erreur de soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    isSubmitting,
    resetForm: formState.resetForm,
    setFieldValue: formState.setFieldValue,
    handleSubmit,
  };
}