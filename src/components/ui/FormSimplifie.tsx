import { useCallback, useEffect } from 'react';
import { useValidatedForm } from './ValidatedForm';

interface FormGroupProps {
  title: string;
  children: React.ReactNode;
}

interface FormActionsProps {
  children: React.ReactNode;
  onCancel?: () => void;
}

interface FormSimplifieProps<T extends object> {
  schema: Parameters<typeof useValidatedForm<T>>[0]['schema'];
  defaultValues: Parameters<typeof useValidatedForm<T>>[0]['defaultValues'];
  onSubmit: Parameters<typeof useValidatedForm<T>>[0]['onSubmit'];
  title: string;
  submitLabel?: string;
  /** État contrôlé du formulaire (optionnel). Si fourni, le parent gère l'état. */
  values?: T;
  /** Callback pour synchroniser les valeurs contrôlées. */
  onChange?: (values: T) => void;
  /** Callback appelé quand les valeurs changent (optionnel). */
  /** Callback pour le bouton Annuler (optionnel). */
  onCancel?: () => void;
}

function FormGroup({ title, children }: FormGroupProps) {
  return (
    <section className="mb-6">
      <h3 className="font-editorial text-lg text-ink mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function FormActions({ children, onCancel }: FormActionsProps) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 pt-4 pb-2 border-t border-ivory/20 bg-ivory/80 backdrop-blur-sm">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 rounded-sm font-medium text-sm text-ink-mut hover:bg-ivory/20 transition-colors"
        >
          Annuler
        </button>
      )}
      {children}
    </div>
  );
}

export function FormSimplifie<T extends object>({
  schema,
  defaultValues,
  onSubmit,
  title,
  submitLabel = 'Valider',
  values,
  onChange,
  onCancel,
  children,
}: FormSimplifieProps<T> & { children: React.ReactNode }) {
  const {
    isValid,
    isSubmitting,
    handleSubmit,
    setFieldValues,
  } = useValidatedForm<T>({
    schema,
    defaultValues,
    onSubmit,
    submitLabel,
  });

  // Synchronise les valeurs contrôlées (prop `values`) vers l'état interne
  // de ValidatedForm afin que la validation et le bouton Enregistrer restent à jour.
  useEffect(() => {
    if (values !== undefined) {
      setFieldValues(values);
    }
  }, [values, setFieldValues]);
  // Synchronise les changements internes vers le parent si onChange est fourni
  useEffect(() => {
    if (onChange) {
      onChange(values as T);
    }
  }, [values, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    },
    []
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto"
      onKeyDown={handleKeyDown}
    >
      <h2 className="font-editorial text-xl text-ink mb-6">{title}</h2>
      <div className="space-y-6 mb-8">{children}</div>
      <FormActions onCancel={onCancel}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-sm font-medium text-sm text-ink-mut hover:bg-ivory/20 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`flex items-center gap-2 px-6 py-3 rounded-sm font-medium transition-colors ${
            isValid && !isSubmitting
              ? 'bg-signal text-ink hover:bg-signal/hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal'
              : 'bg-ivory/50 text-ink-mut cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Enregistrement…' : submitLabel}
        </button>
      </FormActions>
    </form>
  );
}

export { FormGroup, FormActions };
