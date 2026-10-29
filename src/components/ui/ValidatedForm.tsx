import { useState } from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ZodSchema } from 'zod';

interface ValidatedFormProps<T> {
  schema: ZodSchema<T>;
  defaultValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  submitLabel?: string;
  validateOnChange?: boolean;
  onValid?: () => void;
  onInvalid?: () => void;
  /** Callback appelé après une soumission réussie (après onSubmit résolu sans erreur) */
  onSuccess?: (values: T, isEdit: boolean) => void;
  /** Callback appelé en cas d'erreur lors de la soumission */
  onError?: (error: Error) => void;
  /** Réinitialiser le formulaire après succès (défaut: true) */
  resetOnSuccess?: boolean;
  /** Indique si on est en mode édition (pour onSuccess) */
  isEdit?: boolean;
}

interface ValidatedFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldValues: (newValues: Partial<T>) => void;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ValidatedForm<T extends object = Record<string, unknown>>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Soumettre',
  validateOnChange = false,
  onValid,
  onInvalid,
  onSuccess,
  onError,
  resetOnSuccess = true,
  isEdit = false,
}: ValidatedFormProps<T>): ValidatedFormReturn<T> {
  const {
    values,
    errors,
    isValid,
    isDirty,
    setFieldValue,
    setFieldValues,
    resetForm,
    validateForm,
  } = useFormValidation<T>(schema, defaultValues);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      validateForm();
      if (onInvalid) onInvalid();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess(values, isEdit);
      if (resetOnSuccess) resetForm();
    } catch (error) {
      if (onError) onError(error as Error);
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
    setFieldValues,
    resetForm,
    handleSubmit,
  };
}

export function useValidatedForm<T extends object = Record<string, unknown>>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Soumettre',
  validateOnChange = false,
  onValid,
  onInvalid,
  onSuccess,
  onError,
  resetOnSuccess = true,
  isEdit = false,
}: ValidatedFormProps<T>) {
  const formState = useFormValidation<T>(schema, defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (onSuccess) onSuccess(formState.values, isEdit);
      if (resetOnSuccess) formState.resetForm();
    } catch (error) {
      if (onError) onError(error as Error);
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
    setFieldValues: formState.setFieldValues,
    handleSubmit,
  };
}